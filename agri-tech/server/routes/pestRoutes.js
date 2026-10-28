const express = require('express');
const controller = require('../controllers/pestController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { RISK_LEVELS } = require('../utils/constants');

const pestSchema = {
  name: { required: true, maxLength: 120, label: 'Pest / disease name' },
  type: { enum: ['Pest', 'Disease', 'Weed'], label: 'Type' },
  crops: { type: 'array', required: true, maxItems: 20, label: 'Affected crops' },
  riskLevel: { required: true, enum: RISK_LEVELS, label: 'Risk level' },
  region: { maxLength: 100, label: 'Region' },
  detectedOn: { type: 'date', label: 'Detection date' },
  description: { required: true, maxLength: 1200, label: 'Description' },
  preventiveSuggestions: { type: 'array', maxItems: 10, label: 'Preventive suggestions' },
  recommendedAction: { required: true, maxLength: 600, label: 'Recommended action' },
  imageUrl: { maxLength: 500, pattern: /^https?:\/\/\S+$/i, message: 'The image link must start with http:// or https://', label: 'Photo URL' },
  active: { type: 'boolean', label: 'Active' },
};

const router = express.Router();
router.use(protect);

router.get('/', controller.list);
router.post('/', authorize('admin'), validateBody(pestSchema), controller.create);
router.get('/:id', validateObjectId(), controller.get);
router.put('/:id', authorize('admin'), validateObjectId(), validateBody(pestSchema, { partial: true }), controller.update);
router.delete('/:id', authorize('admin'), validateObjectId(), controller.remove);

module.exports = router;
