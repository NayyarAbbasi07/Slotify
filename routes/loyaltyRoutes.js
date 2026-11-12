const express = require('express');
const router = express.Router();

const getLoyalty = require('../controllers/loyalty/getLoyalty');
const getPointsHistory = require('../controllers/loyalty/getPointsHistory');
const redeemPoints = require('../controllers/loyalty/redeemPoints');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getLoyalty', createRateLimiter(), authenticationMiddleware(), getLoyalty);
router.post('/getPointsHistory', createRateLimiter(), authenticationMiddleware(), getPointsHistory);
router.post('/redeemPoints', createRateLimiter(), authenticationMiddleware(), redeemPoints);

module.exports = router;
