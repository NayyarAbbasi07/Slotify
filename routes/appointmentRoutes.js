const express = require('express');
const router = express.Router();

const createAppointment = require('../controllers/appointment/createAppointment');
const getAllAppointments = require('../controllers/appointment/getAllAppointments');
const getAppointmentById = require('../controllers/appointment/getAppointmentById');
const cancelAppointment = require('../controllers/appointment/cancelAppointment');
const rescheduleAppointment = require('../controllers/appointment/rescheduleAppointment');
const acceptAppointment = require('../controllers/appointment/acceptAppointment');
const declineAppointment = require('../controllers/appointment/declineAppointment');
const proposeTime = require('../controllers/appointment/proposeTime');
const checkInAppointment = require('../controllers/appointment/checkInAppointment');
const completeAppointment = require('../controllers/appointment/completeAppointment');
const markNoShow = require('../controllers/appointment/markNoShow');
const rateAttendance = require('../controllers/appointment/rateAttendance');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/createAppointment', createRateLimiter(), authenticationMiddleware(), createAppointment);
router.post('/getAllAppointments', createRateLimiter(), authenticationMiddleware(), getAllAppointments);
router.post('/getAppointmentById', createRateLimiter(), authenticationMiddleware(), getAppointmentById);
router.post('/cancelAppointment', createRateLimiter(), authenticationMiddleware(), cancelAppointment);
router.post('/rescheduleAppointment', createRateLimiter(), authenticationMiddleware(), rescheduleAppointment);
router.post('/acceptAppointment', createRateLimiter(), authenticationMiddleware(), acceptAppointment);
router.post('/declineAppointment', createRateLimiter(), authenticationMiddleware(), declineAppointment);
router.post('/proposeTime', createRateLimiter(), authenticationMiddleware(), proposeTime);
router.post('/checkInAppointment', createRateLimiter(), authenticationMiddleware(), checkInAppointment);
router.post('/completeAppointment', createRateLimiter(), authenticationMiddleware(), completeAppointment);
router.post('/markNoShow', createRateLimiter(), authenticationMiddleware(), markNoShow);
router.post('/rateAttendance', createRateLimiter(), authenticationMiddleware(), rateAttendance);

module.exports = router;
