'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

/**
 * Hashes a plain-text password.
 * @param {string} password - Plain-text password.
 * @returns {Promise<string>} Hashed password.
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain-text password with a stored hash.
 * @param {string} password - Plain-text password.
 * @param {string} hash - Stored bcrypt hash.
 * @returns {Promise<boolean>} True if they match.
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Determines whether a string is already a bcrypt hash.
 * @param {string} value - String to inspect.
 * @returns {boolean}
 */
function isBcryptHash(value) {
  return /^\$2[ab]\$\d{2}\$/.test(value);
}

module.exports = { hashPassword, comparePassword, isBcryptHash };
