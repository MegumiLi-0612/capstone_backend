const router = require('express').Router();
const { body } = require('express-validator');
const applicationController = require('../controllers/application.controller');
const { verifyToken, requireStudent, requireEmployer } = require('../middleware/auth.middleware');

// Validation rules
const submitApplicationValidation = [
  body('jobId').isInt().withMessage('Valid job ID required'),
  body('coverLetter').optional().trim(),
  body('resumeUrl').optional().isURL()
];

// Student routes
router.post('/', verifyToken, requireStudent, submitApplicationValidation, applicationController.submitApplication);
router.get('/my-applications', verifyToken, requireStudent, applicationController.getMyApplications);
router.get('/stats', verifyToken, requireStudent, applicationController.getApplicationStats);
router.delete('/:applicationId', verifyToken, requireStudent, applicationController.withdrawApplication);

// Employer routes
router.get('/job/:jobId', verifyToken, requireEmployer, applicationController.getJobApplications);
router.patch('/:applicationId/status', verifyToken, requireEmployer, applicationController.updateApplicationStatus);

module.exports = router;