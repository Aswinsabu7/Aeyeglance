'use strict';

const jwt = require('jsonwebtoken');

/**
 * Generates a short-lived JWT access token.
 * @param {object} payload - Data to embed in the token.
 * @returns {string} Signed JWT string.
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'sms-api',
    audience: 'sms-client'
  });
}

/**
 * Generates a long-lived refresh token.
 * @param {object} payload - Data to embed in the token.
 * @returns {string} Signed JWT string.
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    issuer: 'sms-api',
    audience: 'sms-client'
  });
}

/**
 * Verifies and decodes an access token.
 * @param {string} token - JWT string to verify.
 * @returns {object} Decoded payload.
 * @throws {Error} If verification fails.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'sms-api',
    audience: 'sms-client'
  });
}

/**
 * Verifies and decodes a refresh token.
 * @param {string} token - JWT string to verify.
 * @returns {object} Decoded payload.
 * @throws {Error} If verification fails.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
    issuer: 'sms-api',
    audience: 'sms-client'
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
