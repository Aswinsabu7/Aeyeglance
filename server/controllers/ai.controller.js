'use strict';

const { analyzeTicket, answerQuestion } = require('../services/ai.service');
const { getTicketById }                 = require('../services/ticket.service');
const { sendSuccess, sendError }        = require('../utils/responseUtils');

/**
 * GET /api/ai/analyze/:id  — auto-analysis for a ticket
 */
async function analyze(req, res, next) {
  try {
    const ticket = await getTicketById(req.params.id);
    const result = analyzeTicket(ticket);
    sendSuccess(res, 'Analysis complete', result);
  } catch (err) { next(err); }
}

/**
 * POST /api/ai/ask/:id  — ask a free-text question about a ticket
 * Body: { question: string }
 */
async function ask(req, res, next) {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length < 2) {
      return sendError(res, 'A question string is required', 400);
    }
    const ticket = await getTicketById(req.params.id);
    const answer = answerQuestion(ticket, question.trim());
    sendSuccess(res, 'Answer generated', { answer });
  } catch (err) { next(err); }
}

module.exports = { analyze, ask };
