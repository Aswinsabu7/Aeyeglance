'use strict';

const { getStatusSummary, getPrioritySummary, getCategorySummary, getStats } = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/responseUtils');

async function statusSummary(req, res, next) {
  try { sendSuccess(res, 'Status summary', await getStatusSummary()); } catch (e) { next(e); }
}

async function prioritySummary(req, res, next) {
  try { sendSuccess(res, 'Priority summary', await getPrioritySummary()); } catch (e) { next(e); }
}

async function categorySummary(req, res, next) {
  try { sendSuccess(res, 'Category summary', await getCategorySummary()); } catch (e) { next(e); }
}

async function stats(req, res, next) {
  try { sendSuccess(res, 'Dashboard stats', await getStats()); } catch (e) { next(e); }
}

module.exports = { statusSummary, prioritySummary, categorySummary, stats };
