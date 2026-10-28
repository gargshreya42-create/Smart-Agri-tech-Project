const Activity = require('../models/Activity');
const logger = require('../utils/logger');

// Records an entry for the "Recent activity" feed. Never throws — activity logging must not break the main action.
async function logActivity(userId, type, message) {
  try {
    await Activity.create({ user: userId, type, message });
  } catch (err) {
    logger.warn('Could not record activity', { message: err.message });
  }
}

module.exports = { logActivity };
