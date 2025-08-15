const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const jobRoutes = require('./job.routes');
const applicationRoutes = require('./application.routes');  // 添加这行

router.get('/ping', (req, res) => res.json({ pong: true }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);  // 添加这行

module.exports = router;
