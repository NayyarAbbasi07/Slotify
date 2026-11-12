'use strict';

const { StatusCodes } = require('http-status-codes');
const { systemService } = require('../../service');

async function getAppConfig(req, res, next) {
  try {
    const data = await systemService.getAppConfig();
    res.status(StatusCodes.OK).json({ message: 'App config', data });
  } catch (error) {
    next(error);
  }
}

module.exports = getAppConfig;
