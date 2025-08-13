const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// General rate limiter for API endpoints
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: (req) => {
    // Skip rate limiting for certain IPs (e.g., for testing)
    const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return whitelist.includes(req.ip);
  }
});

// Strict rate limiter for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 uploads per 5 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  auth: authLimiter,
  general: generalLimiter,
  strict: strictLimiter,
  upload: uploadLimiter
};