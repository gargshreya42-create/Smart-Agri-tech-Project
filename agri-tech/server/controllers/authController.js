const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const logger = require('../utils/logger');

const signToken = (user) => jwt.sign({ id: user._id, role: user.role, tv: user.tokenVersion }, jwtSecret, { expiresIn: jwtExpiresIn });

exports.signToken = signToken;

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, confirmPassword, location, language, role } = req.body;

  if (role && role !== 'farmer') {
    throw new AppError(403, 'Admin accounts cannot be created through public registration.');
  }
  if (password !== confirmPassword) {
    throw new AppError(422, 'Please correct the highlighted fields.', { confirmPassword: 'Passwords do not match.' });
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    const field = existing.email === email ? 'email' : 'phone';
    throw new AppError(409, field === 'email' ? 'An account with this email already exists.' : 'An account with this phone number already exists.', {
      [field]: 'Already registered.',
    });
  }

  const user = await User.create({ name, email, phone, password, location, language, role: 'farmer' });
  logger.info('New farmer registered', { userId: String(user._id) });

  sendSuccess(res, { user, token: signToken(user) }, 'Registration successful. Welcome to Smart Agri-Tech!', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const isEmail = identifier.includes('@');

  const user = await User.findOne(isEmail ? { email: identifier.toLowerCase() } : { phone: identifier }).select('+password');
  // Same message for unknown user and wrong password so accounts cannot be probed.
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Invalid email/phone or password.');
  }
  if (!user.isActive) throw new AppError(403, 'Your account has been deactivated. Please contact support.');

  logger.info('User logged in', { userId: String(user._id), role: user.role });
  sendSuccess(res, { user, token: signToken(user) }, 'Logged in successfully.');
});

// Bumping tokenVersion invalidates every JWT issued earlier for this user.
exports.logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  sendSuccess(res, null, 'Logged out successfully.');
});

exports.me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user }, 'Current user retrieved successfully.');
});
