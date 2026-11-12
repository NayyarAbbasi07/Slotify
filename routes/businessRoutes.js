const express = require('express');
const router = express.Router();

const addBusiness = require('../controllers/business/addBusiness');
const updateBusiness = require('../controllers/business/updateBusiness');
const getBusinessById = require('../controllers/business/getBusinessById');
const getAllBusinesses = require('../controllers/business/getAllBusinesses');
const submitVerification = require('../controllers/business/submitVerification');
const getMyBusiness = require('../controllers/business/getMyBusiness');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/addBusiness', createRateLimiter(), authenticationMiddleware(), addBusiness);
router.post('/updateBusiness', createRateLimiter(), authenticationMiddleware(), updateBusiness);
router.post('/getBusinessById', createRateLimiter(), authenticationMiddleware(), getBusinessById);
router.post('/getAllBusinesses', createRateLimiter(), authenticationMiddleware(), getAllBusinesses);
router.post('/submitVerification', createRateLimiter(), authenticationMiddleware(), submitVerification);
router.post('/getMyBusiness', createRateLimiter(), authenticationMiddleware(), getMyBusiness);

module.exports = router;
