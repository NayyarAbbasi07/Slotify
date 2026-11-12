const express = require('express');
const router = express.Router();

const getCategories = require('../controllers/catalog/getCategories');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getCategories', createRateLimiter(), authenticationMiddleware(), getCategories);

module.exports = router;
