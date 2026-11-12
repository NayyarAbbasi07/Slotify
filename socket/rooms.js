'use strict';

function userRoom(userId) {
  return `user:${userId}`;
}

function businessRoom(businessId) {
  return `business:${businessId}`;
}

function staffRoom(staffId) {
  return `staff:${staffId}`;
}

module.exports = {
  userRoom,
  businessRoom,
  staffRoom,
};
