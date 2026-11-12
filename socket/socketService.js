'use strict';

let io = null;

function setIo(instance) {
  io = instance;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function emitToBusiness(businessId, event, payload) {
  if (!io) return;
  io.to(`business:${businessId}`).emit(event, payload);
}

function emitToStaff(staffId, event, payload) {
  if (!io) return;
  io.to(`staff:${staffId}`).emit(event, payload);
}

/** Closes every socket that was opened with this login session (logout, token rotation). */
function disconnectSession(sessionId) {
  if (!io || !sessionId) return;
  io.in(`session:${sessionId}`).disconnectSockets(true);
}

/** Closes every socket for this user (logout-all, refresh-token reuse). */
function disconnectUser(userId) {
  if (!io || !userId) return;
  io.in(`user:${userId}`).disconnectSockets(true);
}

module.exports = {
  setIo,
  emitToUser,
  emitToBusiness,
  emitToStaff,
  disconnectSession,
  disconnectUser,
};
