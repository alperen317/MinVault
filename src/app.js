const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const swaggerSpecs = require('./config/swagger');
const fileRoutes = require('./routes/fileRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', true);
// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = Array.isArray(config.security.corsOrigin) 
      ? config.security.corsOrigin 
      : [config.security.corsOrigin];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-File-Count']
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '[PROJECT_NAME] API Documentation'
}));

// API routes
app.use('/api/files', fileRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'File Upload Service API',
    version: '1.0.0',
    documentation: `http://localhost:${config.server.port}/api-docs`,
    endpoints: {
      health: 'GET /api/files/health',
      uploadSingle: 'POST /api/files/upload',
      uploadMultiple: 'POST /api/files/upload/multiple',
      getUrl: 'GET /api/files/url/:filename',
      getInfo: 'GET /api/files/info/:filename',
      listFiles: 'GET /api/files/list',
      deleteFile: 'DELETE /api/files/:filename'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
