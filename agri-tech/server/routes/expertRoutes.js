const express = require('express');
const controller = require('../controllers/expertController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../utils/validate');
const { LANGUAGE_CODES } = require('../utils/constants');

const expertSchema = {
  name: { required: true, maxLength: 100, label: 'Name' },
  title: { required: true, maxLength: 120, label: 'Title' },
  expertise: { required: true, maxLength: 120, label: 'Expertise' },
  experienceYears: { type: 'integer', required: true, min: 0, max: 70, label: 'Experience (years)' },
  specializations: { type: 'array', maxItems: 12, label: 'Specializations' },
  availability: { maxLength: 120, label: 'Availability' },
  languages: { type: 'array', maxItems: LANGUAGE_CODES.length, label: 'Languages' },
  bio: { required: true, maxLength: 800, label: 'Biography' },
  isActive: { type: 'boolean', label: 'Active' },
};

const router = express.Router();
router.use(protect);

router.get('/', controller.list);
router.post('/', authorize('admin'), validateBody(expertSchema), controller.create);
router.get('/:id', validateObjectId(), controller.get);
router.put('/:id', authorize('admin'), validateObjectId(), validateBody(expertSchema, { partial: true }), controller.update);
router.delete('/:id', authorize('admin'), validateObjectId(), controller.remove);

module.exports = router;
