const express = require('express');
const controller = require('../controllers/farmController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { SOIL_TYPES, IRRIGATION_TYPES, FARMING_TYPES } = require('../utils/constants');

const farmSchema = {
  name: { required: true, maxLength: 100, label: 'Farm name' },
  location: { required: true, maxLength: 150, label: 'Location' },
  sizeAcres: { type: 'number', required: true, min: 0.01, max: 100000, label: 'Farm size (acres)' },
  soilType: { required: true, enum: SOIL_TYPES, label: 'Soil type' },
  irrigationType: { required: true, enum: IRRIGATION_TYPES, label: 'Irrigation type' },
  farmingType: { enum: FARMING_TYPES, label: 'Farming type' },
  primaryCrops: { type: 'array', maxItems: 15, label: 'Primary crops' },
  imageUrl: { maxLength: 500, pattern: /^https?:\/\/\S+$/i, message: 'The image link must start with http:// or https://', label: 'Farm photo URL' },
  notes: { maxLength: 1000, label: 'Notes' },
};

const router = express.Router();
router.use(protect);

router.get('/', controller.list);
router.post('/', authorize('farmer'), validateBody(farmSchema), controller.create);
router.get('/:id', validateObjectId(), controller.get);
router.put('/:id', validateObjectId(), validateBody(farmSchema, { partial: true }), controller.update);
router.delete('/:id', validateObjectId(), controller.remove);

module.exports = router;
