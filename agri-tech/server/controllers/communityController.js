const Post = require('../models/Post');
const Comment = require('../models/Comment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { logActivity } = require('../services/activityService');
const { searchRegex, getPagination, buildMeta, isAdmin } = require('../utils/helpers');

// Adds `liked` / `likesCount` for the requesting user and hides the raw likes array.
function present(post, userId) {
  const plain = post.toObject ? post.toObject() : post;
  const likes = plain.likes || [];
  const { likes: omit, ...rest } = plain;
  return { ...rest, likesCount: likes.length, liked: likes.some((id) => String(id) === String(userId)) };
}

const canManage = (user, ownerId) => isAdmin(user) || String(ownerId) === String(user._id);

exports.listPosts = asyncHandler(async (req, res) => {
  const { q, category, sort, mine } = req.query;
  const filter = isAdmin(req.user) ? {} : { isHidden: false };
  if (isAdmin(req.user) && req.query.status === 'hidden') filter.isHidden = true;
  if (category) filter.category = String(category);
  if (mine === 'true') filter.author = req.user._id;
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ title: rx }, { body: rx }];
  }

  const order = sort === 'popular' ? { score: -1, createdAt: -1 } : { createdAt: -1 };
  const pagination = getPagination(req.query, 10);

  const [posts, total] = await Promise.all([
    Post.find(filter).populate('author', 'name location').sort(order).skip(pagination.skip).limit(pagination.limit),
    Post.countDocuments(filter),
  ]);
  sendSuccess(res, posts.map((p) => present(p, req.user._id)), 'Posts retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name location');
  if (!post || (post.isHidden && !isAdmin(req.user))) throw new AppError(404, 'Post not found.');
  const comments = await Comment.find({ post: post._id }).populate('author', 'name').sort({ createdAt: 1 }).lean();
  sendSuccess(res, { post: present(post, req.user._id), comments }, 'Post retrieved successfully.');
});

exports.createPost = asyncHandler(async (req, res) => {
  const post = await Post.create({ ...pick(req.body, ['title', 'body', 'category']), author: req.user._id });
  await post.populate('author', 'name location');
  await logActivity(req.user._id, 'community', `Posted in community: "${post.title}"`);
  sendSuccess(res, present(post, req.user._id), 'Post published successfully.', 201);
});

exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError(404, 'Post not found.');
  if (!canManage(req.user, post.author)) throw new AppError(403, 'You can only edit your own posts.');
  Object.assign(post, pick(req.body, ['title', 'body', 'category']));
  await post.save();
  await post.populate('author', 'name location');
  sendSuccess(res, present(post, req.user._id), 'Post updated successfully.');
});

exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError(404, 'Post not found.');
  if (!canManage(req.user, post.author)) throw new AppError(403, 'You can only delete your own posts.');
  await Promise.all([Comment.deleteMany({ post: post._id }), post.deleteOne()]);
  sendSuccess(res, null, 'Post deleted successfully.');
});

exports.toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || (post.isHidden && !isAdmin(req.user))) throw new AppError(404, 'Post not found.');
  const index = post.likes.findIndex((id) => String(id) === String(req.user._id));
  if (index >= 0) post.likes.splice(index, 1);
  else post.likes.push(req.user._id);
  await post.save();
  sendSuccess(res, { liked: index < 0, likesCount: post.likes.length }, index < 0 ? 'Post liked.' : 'Like removed.');
});

// Admin moderation: hide a post from farmers (or restore it) without deleting it.
exports.moderatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError(404, 'Post not found.');
  post.isHidden = req.body.isHidden;
  await post.save();
  sendSuccess(res, { _id: post._id, isHidden: post.isHidden }, post.isHidden ? 'Post hidden from the community.' : 'Post restored to the community.');
});

exports.addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || (post.isHidden && !isAdmin(req.user))) throw new AppError(404, 'Post not found.');

  const { body, parent } = req.body;
  if (parent) {
    const parentComment = await Comment.findOne({ _id: parent, post: post._id });
    if (!parentComment) throw new AppError(422, 'Please correct the highlighted fields.', { parent: 'The comment you are replying to no longer exists.' });
  }

  const comment = await Comment.create({ post: post._id, author: req.user._id, parent: parent || null, body });
  post.commentCount += 1;
  await post.save();
  await comment.populate('author', 'name');
  await logActivity(req.user._id, 'community', `Commented on "${post.title}"`);
  sendSuccess(res, comment, 'Comment added successfully.', 201);
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({ _id: req.params.commentId, post: req.params.id });
  if (!comment) throw new AppError(404, 'Comment not found.');
  if (!canManage(req.user, comment.author)) throw new AppError(403, 'You can only delete your own comments.');

  // Remove the comment together with its replies (replies are one level deep in the UI, but be safe).
  const ids = [comment._id];
  let frontier = [comment._id];
  while (frontier.length) {
    const children = await Comment.find({ parent: { $in: frontier } }).select('_id').lean();
    frontier = children.map((c) => c._id);
    ids.push(...frontier);
  }
  await Comment.deleteMany({ _id: { $in: ids } });

  const post = await Post.findById(req.params.id);
  if (post) {
    post.commentCount = Math.max(0, post.commentCount - ids.length);
    await post.save();
  }
  sendSuccess(res, { removed: ids.length }, 'Comment deleted successfully.');
});
