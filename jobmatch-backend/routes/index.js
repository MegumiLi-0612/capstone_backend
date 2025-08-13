const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');

router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/auth', authRoutes);  // => /api/v1/auth/...

module.exports = router;
