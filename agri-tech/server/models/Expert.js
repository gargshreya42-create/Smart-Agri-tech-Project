const mongoose = require('mongoose');
const { LANGUAGE_CODES } = require('../utils/constants');

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 120 }, // e.g. "Soil Scientist"
    expertise: { type: String, required: true, trim: true, maxlength: 120 },
    experienceYears: { type: Number, required: true, min: 0, max: 70 },
    specializations: [{ type: String, trim: true, maxlength: 60 }],
    availability: { type: String, trim: true, maxlength: 120, default: 'Mon–Sat, 10:00–17:00' },
    languages: [{ type: String, enum: LANGUAGE_CODES }],
    bio: { type: String, required: true, trim: true, maxlength: 800 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

expertSchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.model('Expert', expertSchema);
