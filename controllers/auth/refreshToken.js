const { StatusCodes } = require('http-status-codes');
const { authService } = require('../../service');
const { refreshTokenBodySchema } = require('./authValidation');

async function refreshToken(req, res, next) {
  try {
    const body = await refreshTokenBodySchema.validateAsync(req.body);
    const data = await authService.refreshToken(body, {
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

module.exports = refreshToken;
