const Joi = require('joi');
const { RoleAuthorizationTypes } = require('../../common/enumFunction');

/**
 * Pakistan mobile:
 * - E.164: +923XXXXXXXXX
 * - Local: 03XXXXXXXXX
 * Service normalizes to E.164 before storage.
 */
const phoneSchema = Joi.string()
  .trim()
  .pattern(/^(\+923[0-9]{9}|03[0-9]{9})$/)
  .messages({
    'string.pattern.base':
      'phone must be a valid Pakistan mobile (e.g. +923001234567 or 03001234567)',
    'any.required': 'phone is required',
  });

const otpSchema = Joi.string()
  .trim()
  .length(6)
  .pattern(/^[0-9]{6}$/)
  .messages({
    'string.length': 'otp must be exactly 6 digits',
    'string.pattern.base': 'otp must contain only digits',
    'any.required': 'otp is required',
  });

const deviceIdSchema = Joi.string().trim().uuid().optional().allow(null, '');

const platformSchema = Joi.string()
  .trim()
  .lowercase()
  .valid('ios', 'android', 'web')
  .optional();

const localeSchema = Joi.string().trim().lowercase().valid('en', 'ur').optional();

const genderSchema = Joi.string()
  .trim()
  .lowercase()
  .valid('male', 'female', 'other')
  .optional()
  .allow(null, '');

const signupRoleSchema = Joi.string()
  .trim()
  .uppercase()
  .valid(RoleAuthorizationTypes.Customer, RoleAuthorizationTypes.PartnerOwner)
  .optional()
  .default(RoleAuthorizationTypes.Customer);

const refreshTokenSchema = Joi.string().trim().min(20).required().messages({
  'any.required': 'refreshToken is required',
  'string.min': 'refreshToken is invalid',
});

const joiOptions = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
};

const requestOtpSchema = Joi.object({
  phone: phoneSchema.required(),
  platform: platformSchema,
  deviceId: deviceIdSchema,
}).prefs(joiOptions);

const signupUserSchema = Joi.object({
  phone: phoneSchema.required(),
  otp: otpSchema.required(),
  name: Joi.string().trim().min(2).max(120).optional().allow(null, ''),
  email: Joi.string().trim().email().optional().allow(null, ''),
  locale: localeSchema,
  gender: genderSchema,
  role: signupRoleSchema,
  platform: platformSchema,
  deviceId: deviceIdSchema,
  appVersion: Joi.string().trim().max(20).optional().allow(null, ''),
}).prefs(joiOptions);

const loginUserSchema = Joi.object({
  phone: phoneSchema.required(),
  otp: otpSchema.required(),
  platform: platformSchema,
  deviceId: deviceIdSchema,
  appVersion: Joi.string().trim().max(20).optional().allow(null, ''),
}).prefs(joiOptions);

const googleLoginSchema = Joi.object({
  idToken: Joi.string().trim().min(20).required().messages({
    'any.required': 'idToken is required',
  }),
  role: signupRoleSchema,
  locale: localeSchema,
  platform: platformSchema,
  deviceId: deviceIdSchema,
  appVersion: Joi.string().trim().max(20).optional().allow(null, ''),
}).prefs(joiOptions);

const refreshTokenBodySchema = Joi.object({
  refreshToken: refreshTokenSchema,
  platform: platformSchema,
  deviceId: deviceIdSchema,
}).prefs(joiOptions);

const logoutUserSchema = Joi.object({
  refreshToken: refreshTokenSchema,
}).prefs(joiOptions);

module.exports = {
  requestOtpSchema,
  signupUserSchema,
  loginUserSchema,
  googleLoginSchema,
  refreshTokenBodySchema,
  logoutUserSchema,
  joiOptions,
};
