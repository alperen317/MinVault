const config = require('../config');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
  } else if (err.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    message = 'Storage service unavailable';
    code = 'SERVICE_UNAVAILABLE';
  } else if (err.message.includes('NoSuchBucket')) {
    statusCode = 500;
    message = 'Storage bucket not found';
    code = 'BUCKET_NOT_FOUND';
  } else if (err.message.includes('AccessDenied')) {
    statusCode = 403;
    message = 'Storage access denied';
    code = 'ACCESS_DENIED';
  }

  const errorResponse = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Include stack trace in development
  if (config.server.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};