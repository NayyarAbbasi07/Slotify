const express = require('express');
const router = express.Router();

const addFavourite = require('../controllers/favourite/addFavourite');
const removeFavourite = require('../controllers/favourite/removeFavourite');
const getMyFavourites = require('../controllers/favourite/getMyFavourites');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/addFavourite', createRateLimiter(), authenticationMiddleware(), addFavourite);
router.post('/removeFavourite', createRateLimiter(), authenticationMiddleware(), removeFavourite);
router.post('/getMyFavourites', createRateLimiter(), authenticationMiddleware(), getMyFavourites);

module.exports = router;
