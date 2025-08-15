// server.js
// Express app bootstrap with CORS (for Railway), Helmet, JSON body parsing,
// healthcheck, error handling, and DB connect-before-listen pattern.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const { sequelize } = require('./config/database'); // <- make sure this file exports { sequelize }

const app = express();
const PORT = process.env.PORT || 3000;

// If you use cookies/sessions behind Railway/Proxies
app.set('trust proxy', 1);

// ====== CORS ======
// Allow only your production frontend + local dev origins
const ALLOWED_ORIGINS = [
  'https://capstonefrontend-production-4fdf.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Helmet should go first
app.use(helmet());

// CORS must be registered BEFORE routes
app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser tools like curl/Postman with no Origin
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true // set true only if you will use cookies; OK if using JWT in header as well
}));

// Respond quickly to preflight
app.options('*', cors());

// ====== Body parsers ======
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ====== Health check ======
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

// ====== API routes ======
// NOTE: Adjust to your actual router entry. If your project organizes routes differently,
// change the require path(s) below accordingly.
//try {
  // Example: an index router that mounts /auth, /jobs, etc.
  // e.g., ./routes/index.js -> module.exports = router;
  //const apiRouter = require('./routes');
  //app.use('/api/v1', apiRouter);
//} catch (err) {
  //console.warn('[WARN] API router not found or failed to load:', err.message);
  // You can comment out this block if your project always has ./routes
//}
try {
  const apiRouter = require('./routes');
  app.use('/api/v1', apiRouter);
  console.log('✅ API routes loaded successfully');
} catch (err) {
  console.error('[ERROR] API router failed to load:', err.message);
}
// ====== 404 handler ======
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// ====== Error handler (last) ======
// Keep it last to catch errors from routes/middlewares
// Do NOT leak internal errors in production.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const status = err.status || 500;
  const msg = err.expose ? err.message : (process.env.NODE_ENV === 'development' ? String(err.message || err) : 'Internal Server Error');
  res.status(status).json({ message: msg });
});

// ====== Start server after DB is ready ======
async function startServer() {
  try {
    // Debug DB config (no password) — comment out if noisy
    console.log('[DB CONFIG]', {
      host: process.env.DB_HOST || process.env.MYSQLHOST,
      port: process.env.DB_PORT || process.env.MYSQLPORT,
      name: process.env.DB_NAME || process.env.MYSQLDATABASE,
      user: process.env.DB_USER || process.env.MYSQLUSER
    });

    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    // If you rely on Sequelize sync for schema creation (optional)
    // await sequelize.sync({ alter: false });

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;


