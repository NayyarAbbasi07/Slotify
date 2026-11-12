const { StatusCodes } = require('http-status-codes');
const { authService } = require('../../service');
const { logoutUserSchema } = require('./authValidation');

async function logoutUser(req, res, next) {
  try {
    const body = await logoutUserSchema.validateAsync(req.body);
    const data = await authService.logoutUser(body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = logoutUser;
