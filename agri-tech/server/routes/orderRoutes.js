const express = require('express');
const controller = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { ORDER_STATUSES } = require('../utils/constants');

const router = express.Router();
router.use(protect);

router.get('/', controller.list);
router.post('/', authorize('farmer'), controller.validateOrderPayload, controller.create);
router.get('/:id', validateObjectId(), controller.get);
router.patch('/:id/cancel', authorize('farmer'), validateObjectId(), controller.cancel);
router.patch(
  '/:id/status',
  authorize('admin'),
  validateObjectId(),
  validateBody({ status: { required: true, enum: ORDER_STATUSES, label: 'Status' }, note: { maxLength: 200, label: 'Note' } }),
  controller.updateStatus
);

module.exports = router;
