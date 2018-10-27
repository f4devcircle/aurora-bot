const express = require('express');
const router = express.Router();
const Line = require('../controllers/line.controller');
const ipfilter = require('express-ipfilter').IpFilter;

router.post('/line', Line.index);
router.post('/line/push', ipfilter(['127.0.0.1', 'localhost', '::1'], {mode: 'allow'}), Line.push);

module.exports = router;