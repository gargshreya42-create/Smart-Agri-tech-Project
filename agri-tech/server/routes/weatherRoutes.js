const express = require('express');
const controller = require('../controllers/weatherController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');

const alertSchema = {
  title: { required: true, maxLength: 120, label: 'Title' },
  message: { required: true, maxLength: 600, label: 'Message' },
  severity: { enum: ['info', 'warning', 'danger'], label: 'Severity' },
  region: { maxLength: 100, label: 'Region' },
  active: { type: 'boolean', label: 'Active' },
  expiresAt: { type: 'date', label: 'Expiry date' },
};

const router = express.Router();
router.use(protect);

router.get('/', controller.getForecast);

router.get('/alerts', controller.listAlerts);
router.post('/alerts', authorize('admin'), validateBody(alertSchema), controller.createAlert);
router.put('/alerts/:id', authorize('admin'), validateObjectId(), validateBody(alertSchema, { partial: true }), controller.updateAlert);
router.delete('/alerts/:id', authorize('admin'), validateObjectId(), controller.removeAlert);

router.get('/records', authorize('admin'), controller.listRecords);
router.delete('/records/:id', authorize('admin'), validateObjectId(), controller.removeRecord);

module.exports = router;
