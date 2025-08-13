const jwt = require('jsonwebtoken');
const { User, Student, Employer } = require('../models');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access denied. No token provided.'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with associations
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Student,
          as: 'studentProfile'
        },
        {
          model: Employer,
          as: 'employerProfile'
        }
      ]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token or inactive user.'
        }
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.userType = user.user_type;
    
    // Attach profile based on user type
    if (user.user_type === 'student' && user.studentProfile) {
      req.studentId = user.studentProfile.id;
      req.profile = user.studentProfile;
    } else if (user.user_type === 'employer' && user.employerProfile) {
      req.employerId = user.employerProfile.id;
      req.profile = user.employerProfile;
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token.'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired.'
        }
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Authentication error.'
      }
    });
  }
};

// Verify user is a student
const requireStudent = async (req, res, next) => {
  if (req.userType !== 'student') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'This endpoint is only accessible to students.'
      }
    });
  }
  next();
};

// Verify user is an employer
const requireEmployer = async (req, res, next) => {
  if (req.userType !== 'employer') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'This endpoint is only accessible to employers.'
      }
    });
  }
  next();
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Student,
          as: 'studentProfile'
        },
        {
          model: Employer,
          as: 'employerProfile'
        }
      ]
    });

    if (user && user.is_active) {
      req.user = user;
      req.userId = user.id;
      req.userType = user.user_type;
      
      if (user.user_type === 'student' && user.studentProfile) {
        req.studentId = user.studentProfile.id;
        req.profile = user.studentProfile;
      } else if (user.user_type === 'employer' && user.employerProfile) {
        req.employerId = user.employerProfile.id;
        req.profile = user.employerProfile;
      }
    }
  } catch (error) {
    // Silently continue - this is optional auth
  }
  
  next();
};

module.exports = {
  verifyToken,
  requireStudent,
  requireEmployer,
  optionalAuth
};