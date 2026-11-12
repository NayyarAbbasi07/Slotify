'use strict';

class CustomError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = CustomError;
