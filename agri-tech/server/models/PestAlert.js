const mongoose = require('mongoose');
const { RISK_LEVELS } = require('../utils/constants');

const RISK_SCORE = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const pestAlertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: ['Pest', 'Disease', 'Weed'], default: 'Pest' },
    crops: [{ type: String, required: true, trim: true, maxlength: 60 }],
    riskLevel: { type: String, enum: RISK_LEVELS, required: true },
    riskScore: { type: Number, index: true },
    region: { type: String, trim: true, maxlength: 100 },
    detectedOn: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true, trim: true, maxlength: 1200 },
    preventiveSuggestions: [{ type: String, trim: true, maxlength: 300 }],
    recommendedAction: { type: String, required: true, trim: true, maxlength: 600 },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

pestAlertSchema.pre('validate', function setRiskScore(next) {
  this.riskScore = RISK_SCORE[this.riskLevel] || 0;
  next();
});

pestAlertSchema.index({ active: 1, riskScore: -1, detectedOn: -1 });

module.exports = mongoose.model('PestAlert', pestAlertSchema);
module.exports.RISK_SCORE = RISK_SCORE;
