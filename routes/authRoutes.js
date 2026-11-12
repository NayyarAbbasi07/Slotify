const express = require('express');
const router = express.Router();

const requestOtp = require('../controllers/auth/requestOtp');
const signupUser = require('../controllers/auth/signupUser');
const loginUser = require('../controllers/auth/loginUser');
const googleLogin = require('../controllers/auth/googleLogin');
const logoutUser = require('../controllers/auth/logoutUser');
const logoutAll = require('../controllers/auth/logoutAll');
const refreshToken = require('../controllers/auth/refreshToken');

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

const otpLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 });
const refreshLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 });

router.post('/requestOtp', otpLimiter, requestOtp);
router.post('/signupUser', authLimiter, signupUser);
router.post('/loginUser', authLimiter, loginUser);
router.post('/googleLogin', authLimiter, googleLogin);
router.post('/refreshToken', refreshLimiter, refreshToken);
router.post('/logoutUser', authLimiter, logoutUser);
router.post('/logoutAll', authLimiter, authenticationMiddleware(), logoutAll);

module.exports = router;
