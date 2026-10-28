const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { nodeEnv } = require('../config/env');

const notFound = (req, res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Translates library errors into AppErrors with friendly messages.
function normalizeError(err) {
  if (err instanceof AppError) return err;

  if (err.name === 'CastError') return new AppError(400, 'The requested record ID is not valid.');

  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    return new AppError(422, 'Please correct the highlighted fields.', details);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'value';
    const labels = { email: 'email address', phone: 'phone number', name: 'name' };
    return new AppError(409, `That ${labels[field] || field} is already in use.`, { [field]: 'Already in use.' });
  }

  if (err.type === 'entity.parse.failed') return new AppError(400, 'The request body is not valid JSON.');
  if (err.type === 'entity.too.large') return new AppError(413, 'The request body is too large.');

  if (['MongoNetworkError', 'MongooseServerSelectionError', 'MongoServerSelectionError'].includes(err.name)) {
    return new AppError(503, 'The database is temporarily unavailable. Please try again shortly.');
  }

  return null;
}

// Centralised error handler — the only place that writes error responses.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const known = normalizeError(err);
  const statusCode = known ? known.statusCode : 500;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} failed`, { message: err.message, stack: nodeEnv === 'production' ? undefined : err.stack });
  } else {
    logger.debug(`${req.method} ${req.originalUrl} -> ${statusCode}`, { message: known.message });
  }

  const message = known ? known.message : 'Something went wrong on our side. Please try again.';
  const body = { success: false, message, error: known && known.details ? known.details : {} };
  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
