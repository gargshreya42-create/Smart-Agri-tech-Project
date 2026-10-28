const express = require('express');
const controller = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, validateObjectId, PASSWORD_RULE } = require('../utils/validate');
const { LANGUAGE_CODES } = require('../utils/constants');

const userSchema = {
  name: { required: true, minLength: 2, maxLength: 80, label: 'Name' },
  email: { type: 'email', required: true, label: 'Email' },
  phone: { type: 'phone', required: true, label: 'Phone' },
  password: { ...PASSWORD_RULE, label: 'Password' },
  location: { maxLength: 120, label: 'Location' },
  language: { enum: LANGUAGE_CODES, label: 'Language' },
  role: { enum: ['farmer', 'admin'], label: 'Role' },
  isActive: { type: 'boolean', label: 'Active' },
};

const { password, email, ...editableFields } = userSchema;

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/stats', controller.getStats);
router.get('/reports', controller.getReports);

router.get('/users', controller.listUsers);
router.post('/users', validateBody(userSchema), controller.createUser);
router.put('/users/:id', validateObjectId(), validateBody(editableFields, { partial: true }), controller.updateUser);

module.exports = router;
