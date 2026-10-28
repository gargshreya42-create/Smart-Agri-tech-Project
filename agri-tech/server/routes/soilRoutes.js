const express = require('express');
const controller = require('../controllers/soilController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { SOIL_TYPES } = require('../utils/constants');

const soilSchema = {
  farm: { type: 'objectId', required: true, label: 'Farm' },
  soilType: { enum: SOIL_TYPES, label: 'Soil type' },
  ph: { type: 'number', required: true, min: 0, max: 14, label: 'pH' },
  nitrogen: { type: 'number', required: true, min: 0, max: 5000, label: 'Nitrogen (kg/ha)' },
  phosphorus: { type: 'number', required: true, min: 0, max: 1000, label: 'Phosphorus (kg/ha)' },
  potassium: { type: 'number', required: true, min: 0, max: 5000, label: 'Potassium (kg/ha)' },
  moisture: { type: 'number', required: true, min: 0, max: 100, label: 'Moisture (%)' },
  organicMatter: { type: 'number', required: true, min: 0, max: 100, label: 'Organic matter (%)' },
  sampledOn: { type: 'date', label: 'Sample date' },
  notes: { maxLength: 500, label: 'Notes' },
};

const router = express.Router();
router.use(protect, authorize('farmer'));

router.get('/', controller.list);
router.post('/', validateBody(soilSchema), controller.create);
router.delete('/:id', validateObjectId(), controller.remove);

module.exports = router;
