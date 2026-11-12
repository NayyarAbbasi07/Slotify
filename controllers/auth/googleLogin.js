const { StatusCodes } = require('http-status-codes');
const { authService } = require('../../service');
const { googleLoginSchema } = require('./authValidation');

async function googleLogin(req, res, next) {
  try {
    const body = await googleLoginSchema.validateAsync(req.body);
    const data = await authService.googleLogin(body, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      deviceId: body.deviceId,
      platform: body.platform,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = googleLogin;
