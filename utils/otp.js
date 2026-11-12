'use strict';

const crypto = require('crypto');
const config = require('../config.json');
const { getJwtAccessSecret } = require('../common/secrets');

function generateOtp(length = config.otp?.length || 6) {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
}

/**
 * Keyed hash of an OTP. A 6-digit code has only 10^6 values, so a plain SHA-256 could be reversed
 * instantly from a leaked Redis dump. The HMAC key is server-side, so the dump alone is not enough.
 * Rotating JWT_ACCESS_SECRET invalidates codes that are still pending (they last 5 minutes).
 */
function hashOtp(otp) {
  return crypto
    .createHmac('sha256', getJwtAccessSecret())
    .update(`otp:${String(otp)}`)
    .digest('hex');
}

module.exports = { generateOtp, hashOtp };
