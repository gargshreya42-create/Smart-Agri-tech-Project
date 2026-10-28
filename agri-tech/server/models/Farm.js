const mongoose = require('mongoose');
const { SOIL_TYPES, IRRIGATION_TYPES, FARMING_TYPES } = require('../utils/constants');

const farmSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    location: { type: String, required: true, trim: true, maxlength: 150 },
    sizeAcres: { type: Number, required: true, min: 0.01, max: 100000 },
    soilType: { type: String, enum: SOIL_TYPES, required: true },
    irrigationType: { type: String, enum: IRRIGATION_TYPES, required: true },
    farmingType: { type: String, enum: FARMING_TYPES, default: 'Conventional' },
    primaryCrops: [{ type: String, trim: true, maxlength: 60 }],
    imageUrl: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// A farmer cannot register two farms with the same name.
farmSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Farm', farmSchema);
