const { StatusCodes } = require('http-status-codes');
const { authService } = require('../../service');
const { requestOtpSchema } = require('./authValidation');

async function requestOtp(req, res, next) {
  try {
    const body = await requestOtpSchema.validateAsync(req.body);
    const data = await authService.requestOtp(body, {
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

module.exports = requestOtp;
