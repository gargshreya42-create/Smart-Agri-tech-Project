const express = require('express');
const { getProfile, updateProfile, changePassword, getDashboard, getActivity } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody, PASSWORD_RULE } = require('../utils/validate');
const { LANGUAGE_CODES } = require('../utils/constants');

const router = express.Router();
router.use(protect);

router.get('/profile', getProfile);
router.put(
  '/profile',
  validateBody(
    {
      name: { required: true, minLength: 2, maxLength: 80, label: 'Name' },
      phone: { type: 'phone', required: true, label: 'Phone' },
      location: { required: true, maxLength: 120, label: 'Location' },
      language: { enum: LANGUAGE_CODES, label: 'Language' },
    },
    { partial: true }
  ),
  updateProfile
);
router.put(
  '/password',
  validateBody({
    currentPassword: { required: true, maxLength: 72, label: 'Current password' },
    newPassword: { ...PASSWORD_RULE, label: 'New password' },
  }),
  changePassword
);

router.get('/dashboard', authorize('farmer'), getDashboard);
router.get('/activity', getActivity);

module.exports = router;
