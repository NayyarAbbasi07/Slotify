const express = require('express');
const router = express.Router();

const getMyReferral = require('../controllers/referral/getMyReferral');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getMyReferral', createRateLimiter(), authenticationMiddleware(), getMyReferral);

module.exports = router;
