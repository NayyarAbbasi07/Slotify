const express = require('express');
const router = express.Router();

const getSlots = require('../controllers/availability/getSlots');
const addTimeOff = require('../controllers/availability/addTimeOff');
const getTimeOff = require('../controllers/availability/getTimeOff');
const deleteTimeOff = require('../controllers/availability/deleteTimeOff');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getSlots', createRateLimiter(), authenticationMiddleware(), getSlots);
router.post('/addTimeOff', createRateLimiter(), authenticationMiddleware(), addTimeOff);
router.post('/getTimeOff', createRateLimiter(), authenticationMiddleware(), getTimeOff);
router.post('/deleteTimeOff', createRateLimiter(), authenticationMiddleware(), deleteTimeOff);

module.exports = router;
