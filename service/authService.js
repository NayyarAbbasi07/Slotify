const { StatusCodes } = require('http-status-codes');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config.json');
const CustomError = require('../utils/errorHandlers/CustomError');
const { generateOtp } = require('../utils/otp');
const otpStore = require('../common/otpStore');
const { RoleAuthorizationTypes } = require('../common/enumFunction');
const { models, sequelize } = require('../models/definition');
const sessionService = require('./sessionService');

const { User, UserRole, AuthIdentity } = models;

const googleClientId =
  process.env.GOOGLE_CLIENT_ID || config.google?.clientId || '';
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

const PHONE_REGEX = /^\+923[0-9]{9}$/;

function normalizePhone(phone) {
  let value = String(phone || '').trim().replace(/[\s()-]/g, '');
  if (value.startsWith('0092')) value = `+${value.slice(2)}`;
  if (value.startsWith('92') && !value.startsWith('+')) value = `+${value}`;
  if (value.startsWith('03') && value.length === 11) value = `+92${value.slice(1)}`;
  return value;
}

function assertPkPhone(phone) {
  if (!PHONE_REGEX.test(phone)) {
    throw new CustomError(
      'Phone must be a valid Pakistan mobile in E.164 format (e.g. +923001234567)',
      StatusCodes.BAD_REQUEST
    );
  }
}

async function ensureRole(userId, role, transaction) {
  const existing = await UserRole.findOne({
    where: { user_id: userId, role },
    transaction,
  });
  if (!existing) {
    await UserRole.create(
      { user_id: userId, role, created_by: userId },
      { transaction }
    );
  }
}

async function ensurePhoneIdentity(userId, phone, transaction) {
  const existing = await AuthIdentity.findOne({
    where: { provider: 'phone', provider_user_id: phone },
    transaction,
  });
  if (!existing) {
    await AuthIdentity.create(
      {
        user_id: userId,
        provider: 'phone',
        provider_user_id: phone,
        created_by: userId,
      },
      { transaction }
    );
  }
}

function requestMeta(meta = {}) {
  return {
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
    deviceId: meta.deviceId || null,
    platform: meta.platform || null,
  };
}

async function requestOtp({ phone }, meta = {}) {
  const normalized = normalizePhone(phone);
  assertPkPhone(normalized);

  await otpStore.registerSend(normalized, config.otp?.maxSendsPer15Min || 3);

  const otp = generateOtp(config.otp?.length || 6);
  await otpStore.saveCode(normalized, otp, config.otp?.ttlSeconds || 300);

  // TODO: integrate SMS provider
  // Only the real environment decides this. The OTP is never returned in production.
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    message: 'OTP sent successfully',
    phone: normalized,
    expiresInSeconds: config.otp?.ttlSeconds || 300,
    ...(isDev ? { devOtp: otp } : {}),
  };
}

async function signupUser(
  { phone, otp, name, email, locale, gender, role },
  meta = {}
) {
  const normalized = normalizePhone(phone);
  assertPkPhone(normalized);
  await otpStore.verifyCode(normalized, otp, config.otp?.maxAttempts || 5);

  const existing = await User.findOne({ where: { phone: normalized } });
  if (existing) {
    throw new CustomError(
      'Phone already registered. Please login instead.',
      StatusCodes.CONFLICT
    );
  }

  if (email) {
    const emailTaken = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (emailTaken) {
      throw new CustomError('Email already registered.', StatusCodes.CONFLICT);
    }
  }

  const assignedRole = role || RoleAuthorizationTypes.Customer;
  const allowedSignupRoles = [
    RoleAuthorizationTypes.Customer,
    RoleAuthorizationTypes.PartnerOwner,
  ];
  if (!allowedSignupRoles.includes(assignedRole)) {
    throw new CustomError('Invalid signup role', StatusCodes.BAD_REQUEST);
  }

  const user = await sequelize.transaction(async (transaction) => {
    const created = await User.create(
      {
        phone: normalized,
        name: name ? String(name).trim() : null,
        email: email ? String(email).trim().toLowerCase() : null,
        locale: locale || 'en',
        gender: gender || null,
        status: 'ACTIVE',
      },
      { transaction }
    );

    await ensureRole(created.id, assignedRole, transaction);
    await ensurePhoneIdentity(created.id, normalized, transaction);
    return created;
  });

  const auth = await sessionService.issueTokens(user, requestMeta(meta));
  return {
    message: 'Signup successful',
    isNewUser: true,
    user: auth.user,
    tokens: auth.tokens,
    sessionId: auth.sessionId,
  };
}

async function loginUser({ phone, otp }, meta = {}) {
  const normalized = normalizePhone(phone);
  assertPkPhone(normalized);
  await otpStore.verifyCode(normalized, otp, config.otp?.maxAttempts || 5);

  const user = await User.findOne({ where: { phone: normalized } });
  if (!user) {
    throw new CustomError(
      'No account found for this phone. Please signup first.',
      StatusCodes.NOT_FOUND
    );
  }
  if (user.status === 'BLOCKED') {
    throw new CustomError('Your account has been blocked. Contact support.', StatusCodes.FORBIDDEN);
  }
  if (user.status === 'DELETED') {
    throw new CustomError('This account no longer exists.', StatusCodes.FORBIDDEN);
  }

  await ensurePhoneIdentity(user.id, normalized);

  const auth = await sessionService.issueTokens(user, requestMeta(meta));
  return {
    message: 'Login successful',
    isNewUser: false,
    user: auth.user,
    tokens: auth.tokens,
    sessionId: auth.sessionId,
  };
}

async function googleLogin({ idToken, role, locale }, meta = {}) {
  if (!googleClient || !googleClientId) {
    throw new CustomError(
      'Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in environment.',
      StatusCodes.SERVICE_UNAVAILABLE
    );
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
  } catch (_err) {
    throw new CustomError('Invalid or expired Google ID token', StatusCodes.UNAUTHORIZED);
  }

  const payload = ticket.getPayload();
  const googleSub = payload.sub;
  const email = payload.email ? String(payload.email).toLowerCase() : null;
  const name = payload.name || null;
  const avatarUrl = payload.picture || null;
  const emailVerified = payload.email_verified !== false;

  if (!googleSub) {
    throw new CustomError('Invalid Google token payload', StatusCodes.UNAUTHORIZED);
  }
  if (email && !emailVerified) {
    throw new CustomError('Google email is not verified', StatusCodes.UNAUTHORIZED);
  }

  const assignedRole = role || RoleAuthorizationTypes.Customer;
  const allowedSignupRoles = [
    RoleAuthorizationTypes.Customer,
    RoleAuthorizationTypes.PartnerOwner,
  ];
  if (!allowedSignupRoles.includes(assignedRole)) {
    throw new CustomError('Invalid role', StatusCodes.BAD_REQUEST);
  }

  const { user, isNewUser } = await sequelize.transaction(async (transaction) => {
    let identity = await AuthIdentity.findOne({
      where: { provider: 'google', provider_user_id: googleSub },
      transaction,
    });

    let userRecord;
    let created = false;

    if (identity) {
      userRecord = await User.findByPk(identity.user_id, { transaction });
    } else if (email) {
      userRecord = await User.findOne({ where: { email }, transaction });
    }

    if (!userRecord) {
      userRecord = await User.create(
        {
          email,
          name,
          avatar_url: avatarUrl,
          locale: locale || 'en',
          status: 'ACTIVE',
        },
        { transaction }
      );
      created = true;
    } else {
      await userRecord.update(
        {
          email: userRecord.email || email,
          name: userRecord.name || name,
          avatar_url: userRecord.avatar_url || avatarUrl,
        },
        { transaction }
      );
    }

    if (!userRecord || userRecord.status === 'BLOCKED' || userRecord.status === 'DELETED') {
      throw new CustomError('Account is not active', StatusCodes.FORBIDDEN);
    }

    if (!identity) {
      await AuthIdentity.create(
        {
          user_id: userRecord.id,
          provider: 'google',
          provider_user_id: googleSub,
          email,
          created_by: userRecord.id,
        },
        { transaction }
      );
    }

    if (created) {
      await ensureRole(userRecord.id, assignedRole, transaction);
    }

    return { user: userRecord, isNewUser: created };
  });

  const auth = await sessionService.issueTokens(user, requestMeta(meta));
  return {
    message: isNewUser ? 'Google signup successful' : 'Google login successful',
    isNewUser,
    needsPhone: !user.phone,
    user: auth.user,
    tokens: auth.tokens,
    sessionId: auth.sessionId,
  };
}

async function refreshToken({ refreshToken }, meta = {}) {
  const auth = await sessionService.rotateRefreshToken(refreshToken, requestMeta(meta));
  return {
    message: 'Token refreshed successfully',
    user: auth.user,
    tokens: auth.tokens,
    sessionId: auth.sessionId,
  };
}

async function logoutUser({ refreshToken }) {
  return sessionService.revokeSessionByRefreshToken(refreshToken);
}

async function logoutAll(userId) {
  if (!userId) {
    throw new CustomError('Unauthorized', StatusCodes.UNAUTHORIZED);
  }
  return sessionService.revokeAllSessions(userId);
}

module.exports = {
  requestOtp,
  signupUser,
  loginUser,
  googleLogin,
  refreshToken,
  logoutUser,
  logoutAll,
};
