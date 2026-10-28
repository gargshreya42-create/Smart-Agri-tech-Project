const mongoose = require('mongoose');

// Admin-published weather advisories shown to farmers in the matching region.
const weatherAlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' },
    // "All" applies everywhere; otherwise matched as a case-insensitive substring of the farmer's location.
    region: { type: String, default: 'All', trim: true, maxlength: 100 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

weatherAlertSchema.index({ active: 1, expiresAt: 1 });

module.exports = mongoose.model('WeatherAlert', weatherAlertSchema);
