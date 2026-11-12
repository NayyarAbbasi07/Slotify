'use strict';

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../utils/errorHandlers/CustomError');
const { authenticateAccessToken } = require('./authenticate');
const { RoleAuthorizationTypes } = require('./enumFunction');

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/**
 * HTTP guard for protected routes. Identity and session checks live in common/authenticate.js.
 * Logout and logout-all take effect on the next request, not after the token expires.
 */
function authenticationMiddleware(allowedRoles = []) {
  return async (req, _res, next) => {
    try {
      const token = bearerToken(req);
      if (!token) {
        throw new CustomError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }

      const user = await authenticateAccessToken(token);

      if (allowedRoles.length > 0) {
        const ok = allowedRoles.some((role) =>
          user.roles.includes(String(role).toUpperCase())
        );
        if (!ok) {
          throw new CustomError('Forbidden', StatusCodes.FORBIDDEN);
        }
      }

      req.user = user;
      return next();
    } catch (err) {
      // CustomErrors map to their status; anything else (e.g. DB failure) becomes a 500.
      return next(err);
    }
  };
}

module.exports = {
  authenticationMiddleware,
  RoleAuthorizationTypes,
};
