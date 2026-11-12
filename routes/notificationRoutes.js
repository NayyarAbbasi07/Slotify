const express = require('express');
const router = express.Router();

const getMyNotifications = require('../controllers/notification/getMyNotifications');
const markNotificationAsRead = require('../controllers/notification/markNotificationAsRead');
const markAllNotificationsAsRead = require('../controllers/notification/markAllNotificationsAsRead');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getMyNotifications', createRateLimiter(), authenticationMiddleware(), getMyNotifications);
router.post('/markNotificationAsRead', createRateLimiter(), authenticationMiddleware(), markNotificationAsRead);
router.post('/markAllNotificationsAsRead', createRateLimiter(), authenticationMiddleware(), markAllNotificationsAsRead);

module.exports = router;
