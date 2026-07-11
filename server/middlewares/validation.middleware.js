'use strict';

const Joi = require('joi');
const { sendError } = require('../utils/responseUtils');

// ─── XSS Pattern Detection ────────────────────────────────────────────────────
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<\s*iframe/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /&#x[0-9a-fA-F]+;/gi,
  /&#[0-9]+;/gi
];

/**
 * Checks a string value for XSS attack patterns.
 * @param {string} value
 * @returns {boolean} True if a potential XSS payload is detected.
 */
function containsXss(value) {
  if (typeof value !== 'string') return false;
  return XSS_PATTERNS.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

/**
 * Recursively checks all string fields in an object for XSS.
 * @param {any} obj
 * @returns {boolean}
 */
function hasXssInObject(obj) {
  if (typeof obj === 'string') return containsXss(obj);
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some(val => hasXssInObject(val));
  }
  return false;
}

// ─── Joi Schemas ──────────────────────────────────────────────────────────────
const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).max(100).required()
});

const studentCreateSchema = Joi.object({
  studentId: Joi.string().required().max(20).pattern(/^[A-Z0-9]+$/).messages({
    'string.pattern.base': 'Student ID must contain only uppercase letters and numbers'
  }),
  firstName: Joi.string().required().min(2).max(50).pattern(/^[a-zA-Z\s'\-]+$/).messages({
    'string.pattern.base': 'First name must contain only letters, spaces, hyphens, or apostrophes'
  }),
  lastName: Joi.string().required().min(2).max(50).pattern(/^[a-zA-Z\s'\-]+$/).messages({
    'string.pattern.base': 'Last name must contain only letters, spaces, hyphens, or apostrophes'
  }),
  grade: Joi.string().required().valid('1','2','3','4','5','6','7','8','9','10','11','12'),
  section: Joi.string().required().valid('A','B','C','D','E'),
  gender: Joi.string().required().valid('Male','Female','Other'),
  status: Joi.string().required().valid('Active','Inactive')
});

const studentUpdateSchema = studentCreateSchema;

// ─── Middleware Factories ─────────────────────────────────────────────────────

/**
 * Returns a middleware that validates req.body against the provided Joi schema.
 */
function validate(schema) {
  return (req, res, next) => {
    // XSS check first
    if (hasXssInObject(req.body)) {
      return sendError(res, 'Invalid input: potentially malicious content detected', 400);
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(d => d.message);
      return sendError(res, 'Validation failed', 400, errors);
    }

    req.body = value; // Use the stripped/coerced value
    next();
  };
}

module.exports = {
  validateLogin: validate(loginSchema),
  validateStudentCreate: validate(studentCreateSchema),
  validateStudentUpdate: validate(studentUpdateSchema)
};
