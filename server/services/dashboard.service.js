'use strict';

const { findAll } = require('./file.service');

/**
 * Returns ticket count grouped by status.
 */
async function getStatusSummary() {
  const tickets = await findAll('tickets');
  const summary = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const ORDER = ['open', 'in-progress', 'resolved', 'closed'];
  return ORDER.map(s => ({ status: s, count: summary[s] || 0 }));
}

/**
 * Returns ticket count grouped by priority.
 */
async function getPrioritySummary() {
  const tickets = await findAll('tickets');
  const summary = tickets.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});
  const ORDER = ['critical', 'high', 'medium', 'low'];
  return ORDER.map(p => ({ priority: p, count: summary[p] || 0 }));
}

/**
 * Returns ticket count grouped by category.
 */
async function getCategorySummary() {
  const tickets = await findAll('tickets');
  const summary = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(summary).map(([category, count]) => ({ category, count }));
}

/**
 * Returns high-level stats.
 */
async function getStats() {
  const tickets = await findAll('tickets');
  const total      = tickets.length;
  const open       = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in-progress').length;
  const resolved   = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const critical   = tickets.filter(t => t.priority === 'critical').length;
  return { total, open, inProgress, resolved, critical };
}

module.exports = { getStatusSummary, getPrioritySummary, getCategorySummary, getStats };
