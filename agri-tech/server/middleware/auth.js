const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the Bearer token, loads the user and attaches it to req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw new AppError(401, 'Please log in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid authentication token. Please log in again.';
    throw new AppError(401, message);
  }

  const user = await User.findById(payload.id);
  if (!user || user.tokenVersion !== payload.tv) {
    throw new AppError(401, 'Your session is no longer valid. Please log in again.');
  }
  if (!user.isActive) throw new AppError(403, 'Your account has been deactivated. Please contact support.');

  req.user = user;
  return next();
});

// Role-based access control: authorize('admin') etc. Must run after protect.
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(403, 'You do not have permission to perform this action.'));
  }
  return next();
};

module.exports = { protect, authorize };
