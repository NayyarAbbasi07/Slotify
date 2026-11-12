const express = require('express');
const router = express.Router();

const getUploadUrl = require('../controllers/media/getUploadUrl');
const confirmMedia = require('../controllers/media/confirmMedia');
const deleteMedia = require('../controllers/media/deleteMedia');
const getBusinessMedia = require('../controllers/media/getBusinessMedia');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getUploadUrl', createRateLimiter(), authenticationMiddleware(), getUploadUrl);
router.post('/confirmMedia', createRateLimiter(), authenticationMiddleware(), confirmMedia);
router.post('/deleteMedia', createRateLimiter(), authenticationMiddleware(), deleteMedia);
router.post('/getBusinessMedia', createRateLimiter(), authenticationMiddleware(), getBusinessMedia);

module.exports = router;
