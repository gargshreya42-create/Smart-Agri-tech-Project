// Every API response uses { success, message, data, meta? } (errors: { success, message, error }).
function sendSuccess(res, data = null, message = 'Request completed successfully', statusCode = 200, meta) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess };
