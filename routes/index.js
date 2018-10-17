const express = require('express');
const router = express.Router();
const Line = require('../controllers/line.controller');

router.post('/line', Line.index);
router.post('/line/push', Line.push);

module.exports = router;