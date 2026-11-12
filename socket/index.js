'use strict';

const { Server } = require('socket.io');
const config = require('../config.json');
const { socketAuth } = require('../common/socketAuth');
const socketService = require('./socketService');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: config.cors?.origins || true,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
      socket.join(`session:${socket.user.sessionId}`);
    }

    socket.on('disconnect', () => {});
  });

  socketService.setIo(io);
  console.log('[socket] Socket.IO initialized');
  return io;
}

function getIo() {
  return io;
}

module.exports = {
  initSocket,
  getIo,
};
