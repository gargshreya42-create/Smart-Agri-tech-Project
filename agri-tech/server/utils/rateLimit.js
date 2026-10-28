const AppError = require('./AppError');

// Small in-memory limiter, good enough for a single-instance deployment or demo.
// Swap for a shared store (e.g. Redis) when running several server instances.
function rateLimit({ windowMs = 15 * 60 * 1000, max = 30, message = 'Too many attempts. Please try again later.' } = {}) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    hits.forEach((entry, key) => {
      if (entry.resetAt <= now) hits.delete(key);
    });
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(new AppError(429, message));
    }
    return next();
  };
}

module.exports = rateLimit;
