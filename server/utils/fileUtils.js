'use strict';

const fs = require('fs').promises;
const path = require('path');

/**
 * Reads a JSON file and parses its content.
 * @param {string} filePath - Absolute path to the JSON file.
 * @returns {Promise<any>} Parsed JSON data.
 */
async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Data file not found: ${filePath}`);
    }
    throw new Error(`Failed to read data file: ${error.message}`);
  }
}

/**
 * Atomically writes data to a JSON file using a temp-then-rename strategy
 * to prevent file corruption on concurrent writes.
 * @param {string} filePath - Absolute path to the JSON file.
 * @param {any} data - Data to serialize and write.
 */
async function writeJsonFile(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on failure
    try { await fs.unlink(tempPath); } catch (_) {}
    throw new Error(`Failed to write data file: ${error.message}`);
  }
}

/**
 * Ensures a directory exists, creating it recursively if needed.
 * @param {string} dirPath - Path to the directory.
 */
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

module.exports = { readJsonFile, writeJsonFile, ensureDir };
