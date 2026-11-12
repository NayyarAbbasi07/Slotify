const { StatusCodes } = require('http-status-codes');
const { authService } = require('../../service');

async function logoutAll(req, res, next) {
  try {
    const data = await authService.logoutAll(req.user.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = logoutAll;
