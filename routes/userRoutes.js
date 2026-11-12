const express = require('express');
const router = express.Router();

const getMe = require('../controllers/user/getMe');
const updateMe = require('../controllers/user/updateMe');
const deleteAccount = require('../controllers/user/deleteAccount');
const addAddress = require('../controllers/user/addAddress');
const getAddresses = require('../controllers/user/getAddresses');
const updateAddress = require('../controllers/user/updateAddress');
const deleteAddress = require('../controllers/user/deleteAddress');
const registerDevice = require('../controllers/user/registerDevice');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getMe', createRateLimiter(), authenticationMiddleware(), getMe);
router.post('/updateMe', createRateLimiter(), authenticationMiddleware(), updateMe);
router.post('/deleteAccount', createRateLimiter(), authenticationMiddleware(), deleteAccount);
router.post('/addAddress', createRateLimiter(), authenticationMiddleware(), addAddress);
router.post('/getAddresses', createRateLimiter(), authenticationMiddleware(), getAddresses);
router.post('/updateAddress', createRateLimiter(), authenticationMiddleware(), updateAddress);
router.post('/deleteAddress', createRateLimiter(), authenticationMiddleware(), deleteAddress);
router.post('/registerDevice', createRateLimiter(), authenticationMiddleware(), registerDevice);

module.exports = router;
