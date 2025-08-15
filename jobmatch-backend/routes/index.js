const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

router.get('/ping', (req, res) => res.json({ pong: true }));

router.use('/auth', authRoutes);     // => /api/v1/auth/...
router.use('/users', userRoutes);    // => /api/v1/users/...

module.exports = router;
