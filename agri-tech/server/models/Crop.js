const mongoose = require('mongoose');
const { SOIL_TYPES, IRRIGATION_TYPES, GROWTH_STAGES, CROP_HEALTH } = require('../utils/constants');

const DAY_MS = 24 * 60 * 60 * 1000;

const cropSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    variety: { type: String, trim: true, maxlength: 80 },
    plantingDate: { type: Date, required: true },
    expectedHarvestDate: { type: Date, required: true },
    growthStage: { type: String, enum: GROWTH_STAGES, default: 'Planned' },
    healthStatus: { type: String, enum: CROP_HEALTH, default: 'Healthy' },
    areaAcres: { type: Number, required: true, min: 0.01, max: 100000 },
    soilType: { type: String, enum: SOIL_TYPES },
    irrigationMethod: { type: String, enum: IRRIGATION_TYPES },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

cropSchema.index({ owner: 1, growthStage: 1 });

// Progress through the season based on dates (0–100).
cropSchema.virtual('progress').get(function progress() {
  if (this.growthStage === 'Harvested') return 100;
  const start = this.plantingDate && this.plantingDate.getTime();
  const end = this.expectedHarvestDate && this.expectedHarvestDate.getTime();
  if (!start || !end || end <= start) return 0;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
});

cropSchema.virtual('daysToHarvest').get(function daysToHarvest() {
  if (!this.expectedHarvestDate || this.growthStage === 'Harvested') return null;
  return Math.ceil((this.expectedHarvestDate.getTime() - Date.now()) / DAY_MS);
});

module.exports = mongoose.model('Crop', cropSchema);
