const express = require('express');
const { register, login, logout, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateBody, PASSWORD_RULE } = require('../utils/validate');
const rateLimit = require('../utils/rateLimit');
const { LANGUAGE_CODES } = require('../utils/constants');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: 'Too many attempts. Please wait a few minutes and try again.' });

// Lets API clients send either { identifier } or { email }.
const aliasIdentifier = (req, res, next) => {
  if (req.body && req.body.identifier === undefined && req.body.email !== undefined) req.body.identifier = req.body.email;
  next();
};

router.post(
  '/register',
  authLimiter,
  validateBody({
    name: { required: true, minLength: 2, maxLength: 80, label: 'Name' },
    email: { type: 'email', required: true, label: 'Email' },
    phone: { type: 'phone', required: true, label: 'Phone' },
    password: { ...PASSWORD_RULE, label: 'Password' },
    confirmPassword: { required: true, label: 'Confirm password' },
    location: { required: true, maxLength: 120, label: 'Location' },
    language: { enum: LANGUAGE_CODES, label: 'Language' },
    role: { label: 'Role' },
  }),
  register
);

router.post(
  '/login',
  authLimiter,
  aliasIdentifier,
  validateBody({
    identifier: { required: true, maxLength: 120, label: 'Email or phone' },
    password: { required: true, maxLength: 72, label: 'Password' },
  }),
  login
);

router.post('/logout', protect, logout);
router.get('/me', protect, me);

module.exports = router;
