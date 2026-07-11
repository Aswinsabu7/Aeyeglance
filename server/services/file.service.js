'use strict';

const path = require('path');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');

const DATA_DIR = path.join(__dirname, '../data');

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  tickets: path.join(DATA_DIR, 'tickets.json'),
  refreshTokens: path.join(DATA_DIR, 'refreshTokens.json')
};

// ─── Generic Helpers ──────────────────────────────────────────────────────────

async function findAll(file) {
  return readJsonFile(FILES[file]);
}

async function findById(file, id) {
  const records = await readJsonFile(FILES[file]);
  return records.find(r => r.id === id) || null;
}

async function create(file, record) {
  const records = await readJsonFile(FILES[file]);
  records.push(record);
  await writeJsonFile(FILES[file], records);
  return record;
}

async function update(file, id, updates) {
  const records = await readJsonFile(FILES[file]);
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;
  records[index] = { ...records[index], ...updates };
  await writeJsonFile(FILES[file], records);
  return records[index];
}

async function remove(file, id) {
  const records = await readJsonFile(FILES[file]);
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return false;
  records.splice(index, 1);
  await writeJsonFile(FILES[file], records);
  return true;
}

async function saveAll(file, records) {
  await writeJsonFile(FILES[file], records);
}

module.exports = { findAll, findById, create, update, remove, saveAll, FILES };
