const { validationResult } = require('express-validator');
const { Task } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// Get all tasks for student
const getTasks = async (req, res, next) => {
  try {
    const { completed, priority, category } = req.query;

    const where = { student_id: req.studentId };
    
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }
    if (priority) {
      where.priority = priority;
    }
    if (category) {
      where.category = category;
    }

    const tasks = await Task.findAll({
      where,
      order: [
        ['completed', 'ASC'],
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    // Get statistics
    const stats = await Task.getStats(req.studentId);

    res.json({
      success: true,
      data: {
        tasks: tasks.map(task => ({
          id: task.id,
          text: task.text,
          category: task.category,
          priority: task.priority,
          completed: task.completed,
          completedAt: task.completed_at,
          createdAt: task.created_at
        })),
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new task
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('VALIDATION_ERROR', 'Invalid input data', 400, errors.array()));
    }

    const { text, category = 'custom', priority = 'medium' } = req.body;

    const task = await Task.create({
      student_id: req.studentId,
      text,
      category,
      priority,
      completed: false
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        id: task.id,
        text: task.text,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        createdAt: task.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update task
const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { text, category, priority, completed } = req.body;

    const task = await Task.findOne({
      where: { id: taskId, student_id: req.studentId }
    });

    if (!task) {
      return next(new AppError('NOT_FOUND', 'Task not found', 404));
    }

    // Update fields if provided
    if (text !== undefined) task.text = text;
    if (category !== undefined) task.category = category;
    if (priority !== undefined) task.priority = priority;
    if (completed !== undefined) task.completed = completed;

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: task.id,
        completed: task.completed,
        completedAt: task.completed_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete task
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      where: { id: taskId, student_id: req.studentId }
    });

    if (!task) {
      return next(new AppError('NOT_FOUND', 'Task not found', 404));
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle task completion
const toggleTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      where: { id: taskId, student_id: req.studentId }
    });

    if (!task) {
      return next(new AppError('NOT_FOUND', 'Task not found', 404));
    }

    await task.toggleComplete();

    res.json({
      success: true,
      message: `Task ${task.completed ? 'completed' : 'uncompleted'} successfully`,
      data: {
        id: task.id,
        completed: task.completed,
        completedAt: task.completed_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get initial tasks for new students
const getInitialTasks = async (req, res, next) => {
  try {
    const initialTasks = [
      { text: 'Update resume with latest experience', category: 'resume', priority: 'high' },
      { text: 'Write compelling cover letter template', category: 'application', priority: 'high' },
      { text: 'Research target companies', category: 'research', priority: 'medium' },
      { text: 'Practice coding interview questions', category: 'interview', priority: 'high' },
      { text: 'Update LinkedIn profile', category: 'networking', priority: 'medium' },
      { text: 'Build portfolio website', category: 'portfolio', priority: 'high' },
      { text: 'Network with professionals', category: 'networking', priority: 'low' },
      { text: 'Follow up on applications', category: 'follow-up', priority: 'medium' }
    ];

    res.json({
      success: true,
      data: initialTasks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  getInitialTasks
};