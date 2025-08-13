const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['student', 'employer']),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').optional().isMobilePhone(),
  
  // Student validation
  body('studentDetails.university').if(body('userType').equals('student')).notEmpty(),
  body('studentDetails.major').if(body('userType').equals('student')).notEmpty(),
  body('studentDetails.graduationDate').if(body('userType').equals('student')).isISO8601(),
  body('studentDetails.gpa').if(body('userType').equals('student')).isFloat({ min: 0, max: 4 }),
  
  // Employer validation
  body('employerDetails.companyName').if(body('userType').equals('employer')).notEmpty(),
  body('employerDetails.companyWebsite').if(body('userType').equals('employer')).optional().isURL(),
  body('employerDetails.companySize').if(body('userType').equals('employer')).optional().isIn(['1-10', '11-50', '51-200', '201-500', '500+']),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', verifyToken, authController.getCurrentUser);
router.post('/change-password', verifyToken, changePasswordValidation, authController.changePassword);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;