// Vercel serverless function for backend API
// This will be accessible at /api/backend/*
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// IMMEDIATE DEBUG: Log that serverless function started
console.log('🎯 BACKEND API FUNCTION STARTED AT:', new Date().toISOString());
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('📁 Current directory:', process.cwd());

// Test route - verify function is working
app.get('/test', (req, res) => {
  console.log('✅ BACKEND TEST ROUTE CALLED');
  res.json({
    message: 'Backend API function is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// Import routes dynamically
import showRoutes from '../../backend/src/routes/shows';
import authRoutes from '../../backend/src/routes/auth';
import progressSyncRoutes from '../../backend/src/routes/progress-sync';

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL ? [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`] : ''] : [])
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Enhanced request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🚀 BACKEND REQUEST: ${req.method} ${req.path} (originalUrl: ${req.originalUrl})`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime()
  });
});

// API routes - mount without /api prefix since Vercel handles /api/backend/*
app.use('/shows', showRoutes);
app.use('/auth', authRoutes);
app.use('/progress-sync', progressSyncRoutes);

// 404 handler
app.use('*', (req, res) => {
  console.log(`[404] Backend route not found: ${req.method} ${req.originalUrl} (path: ${req.path})`);
  res.status(404).json({
    success: false,
    error: `Backend route not found`,
    method: req.method,
    path: req.path,
    availableRoutes: [
      'GET /health',
      'POST /auth/login',
      'POST /auth/register',
      'GET /auth/me',
      'GET /shows/universal-search',
      'GET /shows/popular'
    ]
  });
});

// Export for Vercel serverless
export default app;
