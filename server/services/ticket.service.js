'use strict';

const { findAll, findById, create, update, remove } = require('./file.service');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');

/**
 * Returns a paginated + filtered list of tickets.
 */
async function getTickets({ page = 1, limit = 10, search = '', status = '', priority = '', category = '' }) {
  const tickets = await findAll('tickets');

  const q = search.toLowerCase().trim();

  const filtered = tickets.filter(t => {
    const matchSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.ticketId.toLowerCase().includes(q) ||
      t.assignee.toLowerCase().includes(q) ||
      t.reporter.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q));

    const matchStatus   = !status   || t.status   === status;
    const matchPriority = !priority || t.priority === priority;
    const matchCategory = !category || t.category === category;

    return matchSearch && matchStatus && matchPriority && matchCategory;
  });

  const total    = filtered.length;

  // Newest first
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));
  const start    = (pageNum - 1) * limitNum;

  return {
    tickets: filtered.slice(start, start + limitNum),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  };
}

/**
 * Returns a single ticket by numeric id.
 */
async function getTicketById(id) {
  const ticket = await findById('tickets', parseInt(id));
  if (!ticket) {
    throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });
  }
  return ticket;
}

/**
 * Creates a new ticket.
 */
async function createTicket(data) {
  const tickets = await findAll('tickets');
  const maxId = tickets.reduce((max, t) => (t.id > max ? t.id : max), 0);

  // Generate next ticketId
  const nextNum = String(maxId + 1).padStart(3, '0');
  const ticketId = `TKT${nextNum}`;

  const now = new Date().toISOString();
  const newTicket = {
    id:          maxId + 1,
    ticketId,
    title:       data.title,
    description: data.description,
    status:      data.status      || 'open',
    priority:    data.priority    || 'medium',
    category:    data.category    || 'support',
    assignee:    data.assignee    || '',
    reporter:    data.reporter    || '',
    tags:        data.tags        || [],
    createdAt:   now,
    updatedAt:   now
  };

  return create('tickets', newTicket);
}

/**
 * Updates an existing ticket.
 */
async function updateTicket(id, data) {
  const numId = parseInt(id);
  const existing = await findById('tickets', numId);
  if (!existing) {
    throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });
  }

  const updated = await update('tickets', numId, {
    title:       data.title       ?? existing.title,
    description: data.description ?? existing.description,
    status:      data.status      ?? existing.status,
    priority:    data.priority    ?? existing.priority,
    category:    data.category    ?? existing.category,
    assignee:    data.assignee    ?? existing.assignee,
    reporter:    data.reporter    ?? existing.reporter,
    tags:        data.tags        ?? existing.tags,
    updatedAt:   new Date().toISOString()
  });

  if (!updated) {
    throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });
  }
  return updated;
}

/**
 * Deletes a ticket.
 */
async function deleteTicket(id) {
  const removed = await remove('tickets', parseInt(id));
  if (!removed) {
    throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });
  }
  return true;
}

module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket };
