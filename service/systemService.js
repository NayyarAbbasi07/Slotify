'use strict';

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../utils/errorHandlers/CustomError');

async function health() {
  return {
    status: 'ok',
    service: 'slotify-api',
    time: new Date().toISOString(),
  };
}

async function ready() {
  const { sequelize } = require('../models/definition');
  try {
    await sequelize.authenticate();
    return { status: 'ready', db: true };
  } catch (err) {
    throw new CustomError(`Database not ready: ${err.message}`, StatusCodes.SERVICE_UNAVAILABLE);
  }
}

async function getAppConfig() {
  return {
    minSupported: {
      customer: { ios: '1.0.0', android: '1.0.0' },
      partner: { ios: '1.0.0', android: '1.0.0' },
    },
    latest: {
      customer: { ios: '1.0.0', android: '1.0.0' },
      partner: { ios: '1.0.0', android: '1.0.0' },
    },
    featureFlags: {
      onlinePayments: false,
      homeBooking: false,
      urgentBooking: false,
      eventBooking: false,
      chat: true,
    },
    currency: 'PKR',
    timezone: 'Asia/Karachi',
  };
}

module.exports = {
  health,
  ready,
  getAppConfig,
};
