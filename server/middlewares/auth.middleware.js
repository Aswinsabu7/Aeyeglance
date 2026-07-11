'use strict';

const { verifyAccessToken } = require('../utils/jwtUtils');
const { sendError } = require('../utils/responseUtils');

/**
 * Middleware that validates the Authorization Bearer token.
 * Attaches the decoded user payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access token missing or malformed', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Access token has expired', 401);
    }
    return sendError(res, 'Invalid access token', 401);
  }
}

module.exports = { authenticate };
