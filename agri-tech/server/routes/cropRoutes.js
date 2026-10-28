const express = require('express');
const controller = require('../controllers/cropController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { SOIL_TYPES, IRRIGATION_TYPES, GROWTH_STAGES, CROP_HEALTH } = require('../utils/constants');

const cropSchema = {
  farm: { type: 'objectId', required: true, label: 'Farm' },
  name: { required: true, maxLength: 80, label: 'Crop name' },
  variety: { maxLength: 80, label: 'Variety' },
  plantingDate: { type: 'date', required: true, label: 'Planting date' },
  expectedHarvestDate: { type: 'date', required: true, label: 'Expected harvest date' },
  growthStage: { enum: GROWTH_STAGES, label: 'Growth stage' },
  healthStatus: { enum: CROP_HEALTH, label: 'Health status' },
  areaAcres: { type: 'number', required: true, min: 0.01, max: 100000, label: 'Area cultivated (acres)' },
  soilType: { enum: SOIL_TYPES, label: 'Soil type' },
  irrigationMethod: { enum: IRRIGATION_TYPES, label: 'Irrigation method' },
  notes: { maxLength: 1000, label: 'Notes' },
};

const router = express.Router();
router.use(protect);

router.get('/', controller.list);
router.post('/', authorize('farmer'), validateBody(cropSchema), controller.create);
router.get('/:id', validateObjectId(), controller.get);
router.put('/:id', validateObjectId(), validateBody(cropSchema, { partial: true }), controller.update);
router.delete('/:id', validateObjectId(), controller.remove);

module.exports = router;
