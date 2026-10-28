const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const constants = require('../utils/constants');

// Public reference lists used by the client to build select boxes (single source of truth).
exports.getMeta = asyncHandler(async (req, res) => {
  const { LANGUAGE_CODES, ...lists } = constants;
  sendSuccess(res, lists, 'Reference data retrieved successfully.');
});
