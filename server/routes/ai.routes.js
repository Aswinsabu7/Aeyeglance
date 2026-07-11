'use strict';

const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { analyze, ask } = require('../controllers/ai.controller');

router.use(authenticate);

router.get ('/:id',  analyze);
router.post('/:id',  ask);

module.exports = router;
