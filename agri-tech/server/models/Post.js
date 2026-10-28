const mongoose = require('mongoose');
const { POST_CATEGORIES } = require('../utils/constants');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, enum: POST_CATEGORIES, default: 'General', index: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0, min: 0 },
    // Popularity = comments weigh double likes; kept in sync in pre-save so it can be sorted on.
    score: { type: Number, default: 0, index: true },
    isHidden: { type: Boolean, default: false }, // set by admin moderation
  },
  { timestamps: true }
);

postSchema.index({ isHidden: 1, createdAt: -1 });
postSchema.index({ title: 'text', body: 'text' });

postSchema.pre('save', function updateScore(next) {
  this.score = this.commentCount * 2 + this.likes.length;
  next();
});

module.exports = mongoose.model('Post', postSchema);
