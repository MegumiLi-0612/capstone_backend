// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
  
    // Default error
    let statusCode = err.statusCode || 500;
    let errorResponse = {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    };
  
    // Validation errors (from express-validator or Sequelize)
    if (err.name === 'ValidationError' || err.type === 'validation') {
      statusCode = 400;
      errorResponse.error = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.errors || err.array?.() || []
      };
    }
  
    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
      statusCode = 409;
      const field = Object.keys(err.fields)[0];
      errorResponse.error = {
        code: 'DUPLICATE_ENTRY',
        message: `${field} already exists`,
        field: field
      };
    }
  
    // Sequelize foreign key constraint error
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      statusCode = 400;
      errorResponse.error = {
        code: 'INVALID_REFERENCE',
        message: 'Referenced resource does not exist'
      };
    }
  
    // Sequelize database error
    if (err.name === 'SequelizeDatabaseError') {
      statusCode = 400;
      errorResponse.error = {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed'
      };
    }
  
    // JWT errors (handled by auth middleware, but just in case)
    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      errorResponse.error = {
        code: 'UNAUTHORIZED',
        message: 'Invalid token'
      };
    }
  
    if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      errorResponse.error = {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      };
    }
  
    // Custom application errors
    if (err.code && err.message) {
      errorResponse.error = {
        code: err.code,
        message: err.message
      };
      if (err.details) {
        errorResponse.error.details = err.details;
      }
    }
  
    // Not found error
    if (err.code === 'NOT_FOUND') {
      statusCode = 404;
    }
  
    // Forbidden error
    if (err.code === 'FORBIDDEN') {
      statusCode = 403;
    }
  
    // In development, include stack trace
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = err.stack;
    }
  
    res.status(statusCode).json(errorResponse);
  };
  
  // 404 handler
  const notFoundHandler = (req, res, next) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found'
      }
    });
  };
  
  // Async error wrapper
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  // Custom error class
  class AppError extends Error {
    constructor(code, message, statusCode = 400, details = null) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
      this.details = details;
    }
  }
  
  module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError
  };