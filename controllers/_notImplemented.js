'use strict';

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../utils/errorHandlers/CustomError');

function notImplemented(actionName) {
  return async function handler(_req, _res, next) {
    next(new CustomError(`${actionName} not implemented yet`, StatusCodes.NOT_IMPLEMENTED));
  };
}

module.exports = notImplemented;
