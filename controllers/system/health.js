'use strict';

const { StatusCodes } = require('http-status-codes');
const { systemService } = require('../../service');

async function health(req, res, next) {
  try {
    const data = await systemService.health();
    res.status(StatusCodes.OK).json({ message: 'OK', data });
  } catch (error) {
    next(error);
  }
}

module.exports = health;
