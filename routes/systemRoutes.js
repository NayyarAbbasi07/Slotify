const express = require('express');
const router = express.Router();

const health = require('../controllers/system/health');
const ready = require('../controllers/system/ready');
const getAppConfig = require('../controllers/system/getAppConfig');

const createRateLimiter = require('../common/rateLimiter');

// Probes stay GET for load balancers / k8s
router.get('/health', health);
router.get('/ready', ready);

router.post('/getAppConfig', createRateLimiter(), getAppConfig);

module.exports = router;
