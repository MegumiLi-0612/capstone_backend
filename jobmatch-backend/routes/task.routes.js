const router = require('express').Router();
const { body } = require('express-validator');
const taskController = require('../controllers/task.controller');
const { verifyToken, requireStudent } = require('../middleware/auth.middleware');

// Validation rules
const createTaskValidation = [
  body('text').notEmpty().trim().isLength({ max: 500 }),
  body('category').optional().isIn(['resume', 'application', 'interview', 'research', 'networking', 'portfolio', 'follow-up', 'custom']),
  body('priority').optional().isIn(['low', 'medium', 'high'])
];

// All routes require student authentication
router.use(verifyToken, requireStudent);

// Routes
router.get('/', taskController.getTasks);
router.post('/', createTaskValidation, taskController.createTask);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);
router.patch('/:taskId/toggle', taskController.toggleTask);
router.get('/initial', taskController.getInitialTasks);

module.exports = router;