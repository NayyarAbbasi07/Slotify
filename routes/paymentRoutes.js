const express = require('express');
const router = express.Router();

const createPaymentIntent = require('../controllers/payment/createPaymentIntent');
const getPaymentById = require('../controllers/payment/getPaymentById');
const gatewayWebhook = require('../controllers/payment/gatewayWebhook');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/createPaymentIntent', createRateLimiter(), authenticationMiddleware(), createPaymentIntent);
router.post('/getPaymentById', createRateLimiter(), authenticationMiddleware(), getPaymentById);
router.post('/gatewayWebhook', createRateLimiter(), gatewayWebhook);

module.exports = router;
