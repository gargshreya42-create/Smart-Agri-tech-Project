const express = require('express');
const controller = require('../controllers/communityController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { POST_CATEGORIES } = require('../utils/constants');

const postSchema = {
  title: { required: true, minLength: 5, maxLength: 160, label: 'Title' },
  body: { required: true, minLength: 10, maxLength: 4000, label: 'Post' },
  category: { enum: POST_CATEGORIES, label: 'Category' },
};

const router = express.Router();
router.use(protect);

router.get('/posts', controller.listPosts);
router.post('/posts', validateBody(postSchema), controller.createPost);
router.get('/posts/:id', validateObjectId(), controller.getPost);
router.put('/posts/:id', validateObjectId(), validateBody(postSchema, { partial: true }), controller.updatePost);
router.delete('/posts/:id', validateObjectId(), controller.deletePost);

router.post('/posts/:id/like', validateObjectId(), controller.toggleLike);
router.patch(
  '/posts/:id/moderate',
  authorize('admin'),
  validateObjectId(),
  validateBody({ isHidden: { type: 'boolean', required: true, label: 'Hidden flag' } }),
  controller.moderatePost
);

router.post(
  '/posts/:id/comments',
  validateObjectId(),
  validateBody({ body: { required: true, maxLength: 1500, label: 'Comment' }, parent: { type: 'objectId', label: 'Parent comment' } }),
  controller.addComment
);
router.delete('/posts/:id/comments/:commentId', validateObjectId(), validateObjectId('commentId'), controller.deleteComment);

module.exports = router;
