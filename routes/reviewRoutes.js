const express = require('express');
const router = express.Router();

const addReview = require('../controllers/review/addReview');
const updateReview = require('../controllers/review/updateReview');
const getBusinessReviews = require('../controllers/review/getBusinessReviews');
const replyToReview = require('../controllers/review/replyToReview');
const reportReview = require('../controllers/review/reportReview');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/addReview', createRateLimiter(), authenticationMiddleware(), addReview);
router.post('/updateReview', createRateLimiter(), authenticationMiddleware(), updateReview);
router.post('/getBusinessReviews', createRateLimiter(), authenticationMiddleware(), getBusinessReviews);
router.post('/replyToReview', createRateLimiter(), authenticationMiddleware(), replyToReview);
router.post('/reportReview', createRateLimiter(), authenticationMiddleware(), reportReview);

module.exports = router;
