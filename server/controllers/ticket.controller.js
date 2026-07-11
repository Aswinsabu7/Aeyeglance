'use strict';

const { getTickets, getTicketById, createTicket, updateTicket, deleteTicket } = require('../services/ticket.service');
const { sendSuccess, sendError } = require('../utils/responseUtils');

async function list(req, res, next) {
  try {
    const { page, limit, search, status, priority, category } = req.query;
    const result = await getTickets({ page, limit, search, status, priority, category });
    sendSuccess(res, 'Tickets retrieved', result);
  } catch (err) { next(err); }
}

async function show(req, res, next) {
  try {
    const ticket = await getTicketById(req.params.id);
    sendSuccess(res, 'Ticket retrieved', ticket);
  } catch (err) { next(err); }
}

async function store(req, res, next) {
  try {
    const ticket = await createTicket(req.body);
    sendSuccess(res, 'Ticket created', ticket, 201);
  } catch (err) { next(err); }
}

async function patch(req, res, next) {
  try {
    const ticket = await updateTicket(req.params.id, req.body);
    sendSuccess(res, 'Ticket updated', ticket);
  } catch (err) { next(err); }
}

async function destroy(req, res, next) {
  try {
    await deleteTicket(req.params.id);
    sendSuccess(res, 'Ticket deleted');
  } catch (err) { next(err); }
}

module.exports = { list, show, store, patch, destroy };
