'use strict';

module.exports = {
  health: require('./system/health'),
  ready: require('./system/ready'),
  getAppConfig: require('./system/getAppConfig'),

  requestOtp: require('./auth/requestOtp'),
  signupUser: require('./auth/signupUser'),
  loginUser: require('./auth/loginUser'),
  googleLogin: require('./auth/googleLogin'),
  logoutUser: require('./auth/logoutUser'),
  logoutAll: require('./auth/logoutAll'),
  refreshToken: require('./auth/refreshToken'),
};
