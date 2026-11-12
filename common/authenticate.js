'use strict';

const { Op } = require('sequelize');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../utils/errorHandlers/CustomError');
const { verifyAccessToken } = require('../utils/jwt');
const { models } = require('../models/definition');

const { Session, User, UserRole } = models;

/**
 * Resolves an access token to the caller's identity. Used by both HTTP routes and Socket.IO.
 *
 * Checks, in order:
 *  - the JWT signature and expiry
 *  - a live session for that token (not revoked, not expired)
 *  - the user is still ACTIVE
 *
 * Roles are read from user_roles, so blocks and role changes apply immediately.
 * Throws CustomError (401 / 403) for auth failures; other errors (e.g. DB down) propagate as-is.
 */
async function authenticateAccessToken(token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (_err) {
    throw new CustomError('Unauthorized', StatusCodes.UNAUTHORIZED);
  }

  if (!payload.sub || !payload.sid) {
    throw new CustomError('Unauthorized', StatusCodes.UNAUTHORIZED);
  }

  const session = await Session.findOne({
    where: {
      id: payload.sid,
      user_id: payload.sub,
      revoked_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
    include: [
      {
        model: User,
        as: 'user',
        required: true,
        attributes: ['id', 'phone', 'status'],
        include: [{ model: UserRole, as: 'roles', attributes: ['role'] }],
      },
    ],
  });

  if (!session) {
    throw new CustomError('Session expired or revoked', StatusCodes.UNAUTHORIZED);
  }

  const { user } = session;
  if (user.status !== 'ACTIVE') {
    throw new CustomError('Account is not active', StatusCodes.FORBIDDEN);
  }

  return {
    id: user.id,
    roles: user.roles.map((r) => String(r.role).toUpperCase()),
    phone: user.phone,
    sessionId: session.id,
  };
}

module.exports = { authenticateAccessToken };
