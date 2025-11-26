// Vercel serverless function for backend API - Catch-all route handler
// This handles /api/backend and all sub-paths like /api/backend/auth/login
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

// Import routes dynamically (from compiled dist directory)
// Path is relative to frontend/api/backend/ -> ../../../backend/dist/
import showRoutes from '../../../backend/dist/routes/shows';
import authRoutes from '../../../backend/dist/routes/auth';
import progressSyncRoutes from '../../../backend/dist/routes/progress-sync';

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for debugging
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

// Enhanced request logging and path normalization
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🚀 INCOMING: ${req.method} ${req.url} (original: ${req.originalUrl})`);
  
  // Strip /api/backend prefix for Express routing
  if (req.url.startsWith('/api/backend')) {
    req.url = req.url.replace('/api/backend', '') || '/';
    console.log(`[${timestamp}] 🔄 NORMALIZED: ${req.url}`);
  }
  
  next();
});

// Health check / test endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime()
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Backend API function is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/shows', showRoutes);
app.use('/auth', authRoutes);
app.use('/progress-sync', progressSyncRoutes);

// 404 handler
app.use('*', (req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl} (normalized: ${req.url})`);
  res.status(404).json({
    success: false,
    error: `Backend route not found`,
    method: req.method,
    path: req.url,
    originalUrl: req.originalUrl,
    availableRoutes: [
      'GET /api/backend/health',
      'GET /api/backend/test',
      'POST /api/backend/auth/login',
      'POST /api/backend/auth/register',
      'GET /api/backend/auth/me',
      'GET /api/backend/shows/universal-search',
    ]
  });
});

// Export for Vercel serverless
export default app;

