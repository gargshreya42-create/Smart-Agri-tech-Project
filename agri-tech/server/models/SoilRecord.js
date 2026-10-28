const mongoose = require('mongoose');
const { SOIL_TYPES, SOIL_STATUSES } = require('../utils/constants');

const parameterAnalysis = {
  value: Number,
  score: Number,
  status: { type: String, enum: SOIL_STATUSES },
};

const soilRecordSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    soilType: { type: String, enum: SOIL_TYPES },
    ph: { type: Number, required: true, min: 0, max: 14 },
    nitrogen: { type: Number, required: true, min: 0, max: 5000 }, // available N, kg/ha
    phosphorus: { type: Number, required: true, min: 0, max: 1000 }, // available P, kg/ha
    potassium: { type: Number, required: true, min: 0, max: 5000 }, // available K, kg/ha
    moisture: { type: Number, required: true, min: 0, max: 100 }, // %
    organicMatter: { type: Number, required: true, min: 0, max: 100 }, // %
    sampledOn: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: 500 },
    analysis: {
      overallScore: Number,
      overallStatus: { type: String, enum: SOIL_STATUSES },
      parameters: {
        ph: parameterAnalysis,
        nitrogen: parameterAnalysis,
        phosphorus: parameterAnalysis,
        potassium: parameterAnalysis,
        moisture: parameterAnalysis,
        organicMatter: parameterAnalysis,
      },
      recommendations: [{ parameter: String, severity: String, message: String }],
    },
  },
  { timestamps: true }
);

soilRecordSchema.index({ owner: 1, farm: 1, sampledOn: -1 });

module.exports = mongoose.model('SoilRecord', soilRecordSchema);
