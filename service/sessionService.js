'use strict';

const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const { models } = require('../models/definition');
const CustomError = require('../utils/errorHandlers/CustomError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const socketService = require('../socket/socketService');

const { Session, User, UserRole } = models;

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function refreshExpiryDate() {
  const days = 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function getUserRoles(userId) {
  const rows = await UserRole.findAll({ where: { user_id: userId } });
  return rows.map((r) => r.role);
}

function publicUser(user, roles = []) {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    gender: user.gender,
    locale: user.locale,
    status: user.status,
    roles,
  };
}

async function issueTokens(user, meta = {}) {
  const roles = await getUserRoles(user.id);

  const session = await Session.create({
    user_id: user.id,
    device_id: meta.deviceId || null,
    refresh_token_hash: 'pending',
    expires_at: refreshExpiryDate(),
    ip: meta.ip || null,
    user_agent: meta.userAgent || null,
    created_by: user.id,
  });

  const accessToken = signAccessToken({
    sub: user.id,
    sid: session.id,
    roles,
    phone: user.phone,
    email: user.email,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    sid: session.id,
    type: 'refresh',
  });

  await session.update({ refresh_token_hash: hashToken(refreshToken) });

  return {
    user: publicUser(user, roles),
    tokens: {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
    },
    sessionId: session.id,
  };
}

async function rotateRefreshToken(refreshToken, meta = {}) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_err) {
    throw new CustomError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
  }

  if (payload.type !== 'refresh' || !payload.sid) {
    throw new CustomError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
  }

  const session = await Session.findByPk(payload.sid);
  if (!session || session.revoked_at || session.expires_at < new Date()) {
    throw new CustomError('Session expired or revoked', StatusCodes.UNAUTHORIZED);
  }

  if (session.refresh_token_hash !== hashToken(refreshToken)) {
    await Session.update(
      { revoked_at: new Date() },
      { where: { user_id: session.user_id, revoked_at: null } }
    );
    socketService.disconnectUser(session.user_id);
    throw new CustomError('Refresh token reuse detected', StatusCodes.UNAUTHORIZED);
  }

  const user = await User.findByPk(session.user_id);
  if (!user || user.status === 'BLOCKED' || user.status === 'DELETED') {
    throw new CustomError('User not allowed', StatusCodes.FORBIDDEN);
  }

  await session.update({ revoked_at: new Date() });
  // Sockets on the old session are closed; the client reconnects with the new access token.
  socketService.disconnectSession(session.id);
  return issueTokens(user, meta);
}

async function revokeSessionByRefreshToken(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_err) {
    throw new CustomError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
  }

  if (!payload.sid) {
    throw new CustomError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
  }

  const session = await Session.findByPk(payload.sid);
  if (!session) {
    return { message: 'Logged out' };
  }

  if (session.refresh_token_hash !== hashToken(refreshToken)) {
    throw new CustomError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
  }

  await session.update({ revoked_at: new Date() });
  socketService.disconnectSession(session.id);
  return { message: 'Logged out' };
}

async function revokeAllSessions(userId) {
  await Session.update(
    { revoked_at: new Date() },
    {
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    }
  );
  socketService.disconnectUser(userId);
  return { message: 'Logged out from all devices' };
}

module.exports = {
  hashToken,
  issueTokens,
  rotateRefreshToken,
  revokeSessionByRefreshToken,
  revokeAllSessions,
  getUserRoles,
  publicUser,
};
