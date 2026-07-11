'use strict';

const { findAll, saveAll } = require('./file.service');
const { comparePassword } = require('../utils/hashUtils');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const { v4: uuidv4 } = require('uuid');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');
const path = require('path');

const REFRESH_TOKENS_FILE = path.join(__dirname, '../data/refreshTokens.json');

/**
 * Authenticates a user and returns JWT tokens.
 */
async function login(username, password) {
  const users = await findAll('users');
  const user = users.find(u => u.username === username);

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const tokenPayload = { sub: user.id, username: user.username, name: user.name, role: user.role };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ sub: user.id, jti: uuidv4() });

  // Persist refresh token
  const tokens = await readJsonFile(REFRESH_TOKENS_FILE);
  tokens.push({
    token: refreshToken,
    userId: user.id,
    createdAt: new Date().toISOString()
  });
  await writeJsonFile(REFRESH_TOKENS_FILE, tokens);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, name: user.name, role: user.role }
  };
}

/**
 * Issues a new access token given a valid, persisted refresh token.
 */
async function refreshToken(token) {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  // Verify token is stored (not logged-out)
  const tokens = await readJsonFile(REFRESH_TOKENS_FILE);
  const stored = tokens.find(t => t.token === token);
  if (!stored) {
    throw Object.assign(new Error('Refresh token has been revoked'), { statusCode: 401 });
  }

  const users = await findAll('users');
  const user = users.find(u => u.id === decoded.sub);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 401 });
  }

  const accessToken = generateAccessToken({
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  });

  return { accessToken };
}

/**
 * Revokes the supplied refresh token.
 */
async function logout(token) {
  const tokens = await readJsonFile(REFRESH_TOKENS_FILE);
  const filtered = tokens.filter(t => t.token !== token);
  await writeJsonFile(REFRESH_TOKENS_FILE, filtered);
}

module.exports = { login, refreshToken, logout };
