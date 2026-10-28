const express = require('express');
const controller = require('../controllers/expertController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { CONSULTATION_STATUSES } = require('../utils/constants');

const router = express.Router();
router.use(protect);

router.get('/', controller.listConsultations);
router.post(
  '/',
  authorize('farmer'),
  validateBody({
    expert: { type: 'objectId', required: true, label: 'Expert' },
    topic: { required: true, minLength: 5, maxLength: 140, label: 'Topic' },
    description: { required: true, minLength: 10, maxLength: 2000, label: 'Problem description' },
    crop: { maxLength: 80, label: 'Crop' },
    preferredDate: { type: 'date', label: 'Preferred date' },
  }),
  controller.createConsultation
);
router.patch(
  '/:id/status',
  validateObjectId(),
  validateBody({ status: { enum: CONSULTATION_STATUSES, label: 'Status' }, expertResponse: { maxLength: 2000, label: 'Expert response' } }, { partial: true }),
  controller.updateConsultationStatus
);

module.exports = router;
