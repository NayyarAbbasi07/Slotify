const { StatusCodes } = require('http-status-codes');
const { authService } = require('../../service');
const { signupUserSchema } = require('./authValidation');

async function signupUser(req, res, next) {
  try {
    const body = await signupUserSchema.validateAsync(req.body);
    const data = await authService.signupUser(body, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      deviceId: body.deviceId,
      platform: body.platform,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = signupUser;
