'use strict';

const express = require('express');
const router = express.Router();
const { statusSummary, prioritySummary, categorySummary, stats } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/stats',            stats);
router.get('/status-summary',   statusSummary);
router.get('/priority-summary', prioritySummary);
router.get('/category-summary', categorySummary);

module.exports = router;
