'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config.json');
const { getJwtAccessSecret, getJwtRefreshSecret } = require('../common/secrets');

function signAccessToken(payload) {
  return jwt.sign(payload, getJwtAccessSecret(), {
    expiresIn: config.jwt.accessExpiresIn || '15m',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, getJwtRefreshSecret(), {
    expiresIn: config.jwt.refreshExpiresIn || '30d',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtAccessSecret());
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getJwtRefreshSecret());
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
