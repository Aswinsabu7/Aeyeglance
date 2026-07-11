'use strict';

/**
 * Global Express error-handling middleware.
 * Must have four parameters for Express to recognise it as error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.stack || err.message}`);

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred'
      : err.message || 'Something went wrong';

  res.status(statusCode).json({ success: false, message });
}

module.exports = { errorHandler };
