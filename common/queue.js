'use strict';

/**
 * BullMQ queue stub — add bullmq + ioredis when enabling background jobs.
 */
const QUEUE_NAMES = Object.freeze({
  BOOKING_TIMERS: 'booking-timers',
  NOTIFICATIONS: 'notifications',
  REMINDERS: 'reminders',
  MEDIA: 'media',
  FINANCE: 'finance',
  MAINTENANCE: 'maintenance',
});

function getQueue(_name) {
  return null;
}

module.exports = {
  QUEUE_NAMES,
  getQueue,
};
