const express = require('express');
const router = express.Router();

const getFeaturedPlans = require('../controllers/featured/getFeaturedPlans');
const buyFeatured = require('../controllers/featured/buyFeatured');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getFeaturedPlans', createRateLimiter(), authenticationMiddleware(), getFeaturedPlans);
router.post('/buyFeatured', createRateLimiter(), authenticationMiddleware(), buyFeatured);

module.exports = router;
