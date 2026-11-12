'use strict';

const { StatusCodes } = require('http-status-codes');
const { systemService } = require('../../service');

async function ready(req, res, next) {
  try {
    const data = await systemService.ready();
    res.status(StatusCodes.OK).json({ message: 'Ready', data });
  } catch (error) {
    next(error);
  }
}

module.exports = ready;
