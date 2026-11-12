'use strict';

/**
 * OTP storage in Redis (spec §12.1: OTP hashed in Redis, 5-minute TTL, attempt limits, send limits).
 *
 *  - One active code per phone, stored as a hash with a TTL. The code itself is never stored.
 *  - Attempt counting and single-use are enforced inside one Lua script, so concurrent
 *    guesses cannot bypass the attempt limit or use the same code twice.
 *  - Sends are counted in a fixed window per phone.
 *  - If Redis is unavailable, these functions throw a 503 instead of hanging or failing open.
 */

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../utils/errorHandlers/CustomError');
const { hashOtp } = require('../utils/otp');
const { getRedis } = require('./redis');

const SEND_WINDOW_SECONDS = 15 * 60;

const codeKey = (phone) => `otp:code:${phone}`;
const sendKey = (phone) => `otp:sends:${phone}`;

// KEYS[1] = code key, ARGV[1] = hash of submitted code, ARGV[2] = max attempts.
// Returns {status, attemptsLeft}. status: 1 ok, 0 missing/expired, 2 wrong, 3 locked out.
const VERIFY_SCRIPT = `
local key = KEYS[1]
if redis.call('EXISTS', key) == 0 then return {0, 0} end
local attempts = redis.call('HINCRBY', key, 'attempts', 1)
if attempts > tonumber(ARGV[2]) then
  redis.call('DEL', key)
  return {3, 0}
end
if redis.call('HGET', key, 'hash') == ARGV[1] then
  redis.call('DEL', key)
  return {1, 0}
end
return {2, tonumber(ARGV[2]) - attempts}
`;

const STATUS = { EXPIRED: 0, OK: 1, WRONG: 2, LOCKED: 3 };

async function withRedis(fn) {
  try {
    return await fn(getRedis());
  } catch (err) {
    if (err instanceof CustomError) throw err;
    console.error('[otp] redis error:', err.message);
    throw new CustomError(
      'OTP service is temporarily unavailable. Please try again.',
      StatusCodes.SERVICE_UNAVAILABLE
    );
  }
}

/** Counts one OTP send for this phone. Throws 429 once the window limit is reached. */
async function registerSend(phone, maxSends) {
  const key = sendKey(phone);
  const results = await withRedis((redis) =>
    redis.multi().incr(key).expire(key, SEND_WINDOW_SECONDS, 'NX').exec()
  );
  const [incrErr, count] = results[0];
  if (incrErr) {
    throw new CustomError('OTP service is temporarily unavailable. Please try again.', StatusCodes.SERVICE_UNAVAILABLE);
  }
  if (count > maxSends) {
    throw new CustomError('OTP send limit reached. Try again in 15 minutes.', StatusCodes.TOO_MANY_REQUESTS);
  }
}

/** Stores the code for this phone, replacing any earlier one and resetting its attempts. */
async function saveCode(phone, otp, ttlSeconds) {
  const key = codeKey(phone);
  await withRedis((redis) =>
    redis
      .multi()
      .hset(key, { hash: hashOtp(otp), attempts: 0 })
      .expire(key, ttlSeconds)
      .exec()
  );
}

/** Checks the code. A correct code is consumed. Throws a CustomError on any failure. */
async function verifyCode(phone, otp, maxAttempts) {
  const [status, attemptsLeft] = await withRedis((redis) =>
    redis.eval(VERIFY_SCRIPT, 1, codeKey(phone), hashOtp(otp), maxAttempts)
  );

  switch (status) {
    case STATUS.OK:
      return;
    case STATUS.LOCKED:
      throw new CustomError('Too many invalid OTP attempts. Request a new OTP.', StatusCodes.TOO_MANY_REQUESTS);
    case STATUS.WRONG:
      throw new CustomError(
        attemptsLeft > 0 ? `Invalid OTP. ${attemptsLeft} attempt(s) remaining.` : 'Invalid OTP.',
        StatusCodes.BAD_REQUEST
      );
    default:
      throw new CustomError('OTP expired or not found. Please request a new OTP.', StatusCodes.BAD_REQUEST);
  }
}

module.exports = {
  registerSend,
  saveCode,
  verifyCode,
};
