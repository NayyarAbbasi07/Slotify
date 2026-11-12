'use strict';

const rateLimit = require('express-rate-limit');

function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    max: options.max || 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Too many requests, please try again later.',
    },
    ...options,
  });
}

module.exports = createRateLimiter;
