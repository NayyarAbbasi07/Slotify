const express = require('express');
const router = express.Router();

const validateVoucher = require('../controllers/voucher/validateVoucher');
const getMyVouchers = require('../controllers/voucher/getMyVouchers');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/validateVoucher', createRateLimiter(), authenticationMiddleware(), validateVoucher);
router.post('/getMyVouchers', createRateLimiter(), authenticationMiddleware(), getMyVouchers);

module.exports = router;
