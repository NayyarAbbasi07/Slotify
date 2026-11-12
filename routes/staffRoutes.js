const express = require('express');
const router = express.Router();

const addStaff = require('../controllers/staff/addStaff');
const updateStaff = require('../controllers/staff/updateStaff');
const getAllStaff = require('../controllers/staff/getAllStaff');
const getStaffById = require('../controllers/staff/getStaffById');
const deleteStaff = require('../controllers/staff/deleteStaff');
const setStaffHours = require('../controllers/staff/setStaffHours');
const assignStaffServices = require('../controllers/staff/assignStaffServices');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/addStaff', createRateLimiter(), authenticationMiddleware(), addStaff);
router.post('/updateStaff', createRateLimiter(), authenticationMiddleware(), updateStaff);
router.post('/getAllStaff', createRateLimiter(), authenticationMiddleware(), getAllStaff);
router.post('/getStaffById', createRateLimiter(), authenticationMiddleware(), getStaffById);
router.post('/deleteStaff', createRateLimiter(), authenticationMiddleware(), deleteStaff);
router.post('/setStaffHours', createRateLimiter(), authenticationMiddleware(), setStaffHours);
router.post('/assignStaffServices', createRateLimiter(), authenticationMiddleware(), assignStaffServices);

module.exports = router;
