const mongoose = require('mongoose');
const { RESOURCE_CATEGORIES } = require('../utils/constants');

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: RESOURCE_CATEGORIES, required: true, index: true },
    brand: { type: String, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 800 },
    price: { type: Number, required: true, min: 0 }, // INR per unit
    unit: { type: String, required: true, trim: true, maxlength: 40 }, // e.g. "50 kg bag"
    stock: { type: Number, required: true, min: 0, default: 0 },
    available: { type: Boolean, default: true },
    imageUrl: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

resourceSchema.index({ name: 1 });

resourceSchema.virtual('inStock').get(function inStock() {
  return this.available && this.stock > 0;
});

module.exports = mongoose.model('Resource', resourceSchema);
