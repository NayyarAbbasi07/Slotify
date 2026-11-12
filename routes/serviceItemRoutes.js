const express = require('express');
const router = express.Router();

const addService = require('../controllers/serviceItem/addService');
const updateService = require('../controllers/serviceItem/updateService');
const getAllServices = require('../controllers/serviceItem/getAllServices');
const getServiceById = require('../controllers/serviceItem/getServiceById');
const deleteService = require('../controllers/serviceItem/deleteService');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/addService', createRateLimiter(), authenticationMiddleware(), addService);
router.post('/updateService', createRateLimiter(), authenticationMiddleware(), updateService);
router.post('/getAllServices', createRateLimiter(), authenticationMiddleware(), getAllServices);
router.post('/getServiceById', createRateLimiter(), authenticationMiddleware(), getServiceById);
router.post('/deleteService', createRateLimiter(), authenticationMiddleware(), deleteService);

module.exports = router;
