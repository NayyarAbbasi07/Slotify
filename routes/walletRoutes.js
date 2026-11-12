const express = require('express');
const router = express.Router();

const getWallet = require('../controllers/wallet/getWallet');
const getLedger = require('../controllers/wallet/getLedger');
const payCommission = require('../controllers/wallet/payCommission');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getWallet', createRateLimiter(), authenticationMiddleware(), getWallet);
router.post('/getLedger', createRateLimiter(), authenticationMiddleware(), getLedger);
router.post('/payCommission', createRateLimiter(), authenticationMiddleware(), payCommission);

module.exports = router;
