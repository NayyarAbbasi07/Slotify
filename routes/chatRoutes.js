const express = require('express');
const router = express.Router();

const getMessages = require('../controllers/chat/getMessages');
const sendMessage = require('../controllers/chat/sendMessage');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getMessages', createRateLimiter(), authenticationMiddleware(), getMessages);
router.post('/sendMessage', createRateLimiter(), authenticationMiddleware(), sendMessage);

module.exports = router;
