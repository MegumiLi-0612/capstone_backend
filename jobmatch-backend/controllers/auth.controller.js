const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Student, Employer } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new user
const register = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('VALIDATION_ERROR', 'Invalid input data', 400, errors.array()));
    }

    const { email, password, userType, firstName, lastName, phone, studentDetails, employerDetails } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return next(new AppError('DUPLICATE_ENTRY', 'Email already registered', 409));
    }

    // Create user
    const user = await User.create({
      email,
      password_hash: password, // Will be hashed by the model hook
      user_type: userType,
      first_name: firstName,
      last_name: lastName,
      phone
    });

    // Create profile based on user type
    if (userType === 'student' && studentDetails) {
      await Student.create({
        user_id: user.id,
        university: studentDetails.university,
        major: studentDetails.major,
        graduation_date: studentDetails.graduationDate,
        gpa: studentDetails.gpa
      });
    } else if (userType === 'employer' && employerDetails) {
      await Employer.create({
        user_id: user.id,
        company_name: employerDetails.companyName,
        company_website: employerDetails.companyWebsite,
        company_size: employerDetails.companySize,
        industry: employerDetails.industry,
        company_description: employerDetails.companyDescription
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user.id,
        email: user.email,
        userType: user.user_type,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('VALIDATION_ERROR', 'Invalid input data', 400, errors.array()));
    }

    const { email, password } = req.body;

    // Find user with profile
    const user = await User.findOne({
      where: { email },
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

    if (!user) {
      return next(new AppError('UNAUTHORIZED', 'Invalid email or password', 401));
    }

    // Check password
    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
      return next(new AppError('UNAUTHORIZED', 'Invalid email or password', 401));
    }

    // Check if user is active
    if (!user.is_active) {
      return next(new AppError('FORBIDDEN', 'Account is inactive', 403));
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        email: user.email,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;
    
    const userData = {
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      lastLogin: user.last_login
    };

    // Add profile data
    if (user.user_type === 'student' && user.studentProfile) {
      userData.studentProfile = {
        university: user.studentProfile.university,
        major: user.studentProfile.major,
        graduationDate: user.studentProfile.graduation_date,
        gpa: user.studentProfile.gpa,
        resumeUrl: user.studentProfile.resume_url,
        linkedinUrl: user.studentProfile.linkedin_url,
        githubUrl: user.studentProfile.github_url,
        bio: user.studentProfile.bio
      };
    } else if (user.user_type === 'employer' && user.employerProfile) {
      userData.employerProfile = {
        companyName: user.employerProfile.company_name,
        companyWebsite: user.employerProfile.company_website,
        companySize: user.employerProfile.company_size,
        industry: user.employerProfile.industry,
        companyDescription: user.employerProfile.company_description,
        logoUrl: user.employerProfile.logo_url,
        isVerified: user.employerProfile.is_verified
      };
    }

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isValidPassword = await user.validPassword(currentPassword);
    if (!isValidPassword) {
      return next(new AppError('UNAUTHORIZED', 'Current password is incorrect', 401));
    }

    // Update password
    user.password_hash = newPassword; // Will be hashed by the model hook
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Logout (optional - for token blacklisting if implemented)
const logout = async (req, res, next) => {
  try {
    // In a production app, you might want to blacklist the token here
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  changePassword,
  logout
};