'use strict';

const CustomError = require('../utils/errorHandlers/CustomError');
const { authenticateAccessToken } = require('./authenticate');

function tokenFromHandshake(socket) {
  const fromAuth = socket.handshake.auth?.token;
  if (fromAuth) return String(fromAuth);

  const header = socket.handshake.headers?.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/**
 * Socket.IO handshake middleware. Connections need a valid, live session.
 * On success socket.user has the same shape as req.user in HTTP routes.
 * Failures are rejected before the connection is established.
 */
async function socketAuth(socket, next) {
  const token = tokenFromHandshake(socket);
  if (!token) {
    return next(new Error('Unauthorized'));
  }

  try {
    socket.user = await authenticateAccessToken(token);
    return next();
  } catch (err) {
    if (err instanceof CustomError) {
      return next(new Error('Unauthorized'));
    }
    console.error('[socket] auth failed unexpectedly:', err.message);
    return next(new Error('Service unavailable'));
  }
}

module.exports = { socketAuth };
