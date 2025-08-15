const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const jobRoutes = require('./job.routes');  // 添加这行

router.get('/ping', (req, res) => res.json({ pong: true }));

router.use('/auth', authRoutes);     // => /api/v1/auth/...
router.use('/users', userRoutes);    // => /api/v1/users/...
router.use('/jobs', jobRoutes);      // 添加这行

module.exports = router;
