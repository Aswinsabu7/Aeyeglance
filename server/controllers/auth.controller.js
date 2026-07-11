'use strict';

const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/responseUtils');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body.username, req.body.password);
    sendSuccess(res, 'Login successful', result, 200);
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token is required', 400);

    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, 'Token refreshed successfully', result);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    sendSuccess(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = { login, refresh, logout };
