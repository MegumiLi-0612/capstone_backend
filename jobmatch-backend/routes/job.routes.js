const router = require('express').Router();
const { body } = require('express-validator');
const jobController = require('../controllers/job.controller');
const { verifyToken, requireEmployer, optionalAuth } = require('../middleware/auth.middleware');

// Validation rules
const createJobValidation = [
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('location').notEmpty().trim(),
  body('type').isIn(['Full-time', 'Part-time', 'Internship', 'Contract']),
  body('workType').isIn(['On-site', 'Remote', 'Hybrid']),
  body('experienceLevel').isIn(['Entry Level', 'Mid Level', 'Senior Level']),
  body('salaryMin').optional().isNumeric(),
  body('salaryMax').optional().isNumeric(),
  body('hourlyRate').optional().isNumeric(),
  body('hoursPerWeek').optional().isInt({ min: 1, max: 80 }),
  body('startDate').optional().isISO8601(),
  body('applicationDeadline').optional().isISO8601(),
  body('requirements').optional().isArray(),
  body('skills').optional().isArray(),
  body('benefits').optional().isArray()
];

// Public routes (with optional auth for checking application status)
router.get('/', optionalAuth, jobController.getJobs);
router.get('/:jobId', optionalAuth, jobController.getJobById);

// Employer-only routes
router.post('/', verifyToken, requireEmployer, createJobValidation, jobController.createJob);
router.put('/:jobId', verifyToken, requireEmployer, jobController.updateJob);
router.delete('/:jobId', verifyToken, requireEmployer, jobController.deleteJob);
router.get('/employer/my-jobs', verifyToken, requireEmployer, jobController.getEmployerJobs);

module.exports = router;