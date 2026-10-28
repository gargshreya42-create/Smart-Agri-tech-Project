const express = require('express');
const controller = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { RESOURCE_CATEGORIES } = require('../utils/constants');

const resourceSchema = {
  name: { required: true, maxLength: 120, label: 'Product name' },
  category: { required: true, enum: RESOURCE_CATEGORIES, label: 'Category' },
  brand: { maxLength: 80, label: 'Brand' },
  description: { required: true, maxLength: 800, label: 'Description' },
  price: { type: 'number', required: true, min: 0, label: 'Price (₹)' },
  unit: { required: true, maxLength: 40, label: 'Unit' },
  stock: { type: 'integer', required: true, min: 0, label: 'Stock' },
  available: { type: 'boolean', label: 'Available' },
  imageUrl: { maxLength: 500, pattern: /^https?:\/\/\S+$/i, message: 'The image link must start with http:// or https://', label: 'Image URL' },
};

const router = express.Router();
router.use(protect);

router.get('/', controller.list);
router.post('/', authorize('admin'), validateBody(resourceSchema), controller.create);
router.get('/:id', validateObjectId(), controller.get);
router.put('/:id', authorize('admin'), validateObjectId(), validateBody(resourceSchema, { partial: true }), controller.update);
router.delete('/:id', authorize('admin'), validateObjectId(), controller.remove);

module.exports = router;
