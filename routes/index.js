const express = require('express');
const router = express.Router();
const Line = require('../controllers/line.controller');

router.post('/line', Line.index);

module.exports = router;