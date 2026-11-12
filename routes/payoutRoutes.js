const express = require('express');
const router = express.Router();

const getPayouts = require('../controllers/payout/getPayouts');
const upsertPayoutAccount = require('../controllers/payout/upsertPayoutAccount');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getPayouts', createRateLimiter(), authenticationMiddleware(), getPayouts);
router.post('/upsertPayoutAccount', createRateLimiter(), authenticationMiddleware(), upsertPayoutAccount);

module.exports = router;
