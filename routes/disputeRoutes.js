const express = require('express');
const router = express.Router();

const addDispute = require('../controllers/dispute/addDispute');
const getDisputeById = require('../controllers/dispute/getDisputeById');
const getAllDisputes = require('../controllers/dispute/getAllDisputes');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/addDispute', createRateLimiter(), authenticationMiddleware(), addDispute);
router.post('/getDisputeById', createRateLimiter(), authenticationMiddleware(), getDisputeById);
router.post('/getAllDisputes', createRateLimiter(), authenticationMiddleware(), getAllDisputes);

module.exports = router;
