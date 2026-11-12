const express = require('express');
const router = express.Router();

const getDashboardCounts = require('../controllers/admin/getDashboardCounts');
const approveBusiness = require('../controllers/admin/approveBusiness');
const rejectBusiness = require('../controllers/admin/rejectBusiness');
const suspendBusiness = require('../controllers/admin/suspendBusiness');
const getAllUsers = require('../controllers/admin/getAllUsers');
const blockUser = require('../controllers/admin/blockUser');
const adjustReliability = require('../controllers/admin/adjustReliability');
const getAllAppointments = require('../controllers/admin/getAllAppointments');
const adminCancelAppointment = require('../controllers/admin/adminCancelAppointment');
const moderateMedia = require('../controllers/admin/moderateMedia');
const moderateReview = require('../controllers/admin/moderateReview');
const getPlatformSettings = require('../controllers/admin/getPlatformSettings');
const updatePlatformSettings = require('../controllers/admin/updatePlatformSettings');
const manageCategories = require('../controllers/admin/manageCategories');
const getAuditLog = require('../controllers/admin/getAuditLog');
const approvePayoutBatch = require('../controllers/admin/approvePayoutBatch');
const processRefund = require('../controllers/admin/processRefund');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/getDashboardCounts', createRateLimiter(), authenticationMiddleware(), getDashboardCounts);
router.post('/approveBusiness', createRateLimiter(), authenticationMiddleware(), approveBusiness);
router.post('/rejectBusiness', createRateLimiter(), authenticationMiddleware(), rejectBusiness);
router.post('/suspendBusiness', createRateLimiter(), authenticationMiddleware(), suspendBusiness);
router.post('/getAllUsers', createRateLimiter(), authenticationMiddleware(), getAllUsers);
router.post('/blockUser', createRateLimiter(), authenticationMiddleware(), blockUser);
router.post('/adjustReliability', createRateLimiter(), authenticationMiddleware(), adjustReliability);
router.post('/getAllAppointments', createRateLimiter(), authenticationMiddleware(), getAllAppointments);
router.post('/adminCancelAppointment', createRateLimiter(), authenticationMiddleware(), adminCancelAppointment);
router.post('/moderateMedia', createRateLimiter(), authenticationMiddleware(), moderateMedia);
router.post('/moderateReview', createRateLimiter(), authenticationMiddleware(), moderateReview);
router.post('/getPlatformSettings', createRateLimiter(), authenticationMiddleware(), getPlatformSettings);
router.post('/updatePlatformSettings', createRateLimiter(), authenticationMiddleware(), updatePlatformSettings);
router.post('/manageCategories', createRateLimiter(), authenticationMiddleware(), manageCategories);
router.post('/getAuditLog', createRateLimiter(), authenticationMiddleware(), getAuditLog);
router.post('/approvePayoutBatch', createRateLimiter(), authenticationMiddleware(), approvePayoutBatch);
router.post('/processRefund', createRateLimiter(), authenticationMiddleware(), processRefund);

module.exports = router;
