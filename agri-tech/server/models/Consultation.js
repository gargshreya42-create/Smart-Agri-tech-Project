const mongoose = require('mongoose');
const { CONSULTATION_STATUSES } = require('../utils/constants');

const consultationSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expert: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true, index: true },
    topic: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    crop: { type: String, trim: true, maxlength: 80 },
    preferredDate: { type: Date },
    status: { type: String, enum: CONSULTATION_STATUSES, default: 'Requested', index: true },
    expertResponse: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

consultationSchema.index({ farmer: 1, createdAt: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);
