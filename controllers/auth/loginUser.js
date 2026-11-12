const { StatusCodes } = require('http-status-codes');
const { authService } = require('../../service');
const { loginUserSchema } = require('./authValidation');

async function loginUser(req, res, next) {
  try {
    const body = await loginUserSchema.validateAsync(req.body);
    const data = await authService.loginUser(body, {
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

module.exports = loginUser;
