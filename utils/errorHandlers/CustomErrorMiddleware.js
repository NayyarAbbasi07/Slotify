const CustomError = require('./CustomError');

function CustomErrorMiddleware(err, _req, res, _next) {
  if (err && err.isJoi) {
    return res.status(400).json({
      success: false,
      message: err.details?.[0]?.message || 'Validation error',
      details: err.details?.map((d) => ({
        field: d.path?.join('.') || null,
        message: d.message,
      })),
    });
  }

  const status = err.statusCode || err.status || 500;
  const payload = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  if (err instanceof CustomError && err.details) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && status >= 500 && err.stack) {
    payload.stack = err.stack;
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json(payload);
}

module.exports = CustomErrorMiddleware;
