'use strict';

const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { list, show, store, patch, destroy } = require('../controllers/ticket.controller');

router.use(authenticate);

router.get   ('/',    list);
router.get   ('/:id', show);
router.post  ('/',    store);
router.put   ('/:id', patch);
router.delete('/:id', destroy);

module.exports = router;
