'use strict';

/**
 * Sends a standardised success response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {any} data
 * @param {number} [statusCode=200]
 */
function sendSuccess(res, message, data = null, statusCode = 200) {
  const payload = { success: true, message };
  if (data !== null && data !== undefined) payload.data = data;
  return res.status(statusCode).json(payload);
}

/**
 * Sends a standardised error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=400]
 * @param {any} [errors]
 */
function sendError(res, message, statusCode = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
}

module.exports = { sendSuccess, sendError };
