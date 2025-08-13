const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS configuration - 允许前端访问
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import database connection
const { sequelize } = require('./config/database');

// Import rate limiter
const rateLimiter = require('./middleware/rateLimiter');

// Apply rate limiting to auth routes
app.use('/api/v1/auth', rateLimiter.auth);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'JobMatch Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      documentation: '/api/v1/docs'
    }
  });
});

// API Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/jobs', require('./routes/job.routes'));
app.use('/api/v1/applications', require('./routes/application.routes'));
app.use('/api/v1/tasks', require('./routes/task.routes'));
app.use('/api/v1/skills', require('./routes/skill.routes'));
app.use('/api/v1/saved-jobs', require('./routes/savedJob.routes'));

// Import error handlers
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      // 使用 alter: true 来更新表结构而不删除数据
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced successfully.');
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API Base: http://localhost:${PORT}/api/v1`);
      console.log('='.repeat(50));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        sequelize.close();
      });
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;