const express = require('express');
const router = express.Router();

const searchBusinesses = require('../controllers/search/searchBusinesses');
const getFeaturedBusinesses = require('../controllers/search/getFeaturedBusinesses');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/searchBusinesses', createRateLimiter(), authenticationMiddleware(), searchBusinesses);
router.post('/getFeaturedBusinesses', createRateLimiter(), authenticationMiddleware(), getFeaturedBusinesses);

module.exports = router;
