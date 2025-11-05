// Vercel serverless function entry point
// Handles /api/* routes with proper path preservation
// Routes are mounted with /api prefix since Vercel preserves full paths
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
console.log('🎯 SERVERLESS FUNCTION STARTED AT:', new Date().toISOString());
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('📁 Current directory:', process.cwd());
console.log('📦 Available env vars:', Object.keys(process.env).filter(key => key.includes('VERCEL') || key.includes('NODE')));

// Test route - add BEFORE any middleware to verify function is called
app.get('/api/test-function', (req, res) => {
  console.log('✅ TEST ROUTE CALLED');
  res.json({
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform
  });
});

// Enhanced request logging middleware (for debugging)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${req.method}] ${req.originalUrl || req.url}`, {
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    query: req.query,
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    }
  });
  next();
});

// Path normalization middleware for Vercel
// Frontend calls /backend-api/*, Vercel routes to api/index.ts
// We need to normalize /backend-api/* to /api/* for our route handlers
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const originalPath = req.path;

  console.log(`[${timestamp}] 📨 INCOMING REQUEST: ${req.method} ${req.path} (originalUrl: ${req.originalUrl})`);

  // Handle /backend-api/* → /api/* conversion
  let normalizedPath = originalPath;
  if (originalPath.startsWith('/backend-api/')) {
    normalizedPath = originalPath.replace(/^\/backend-api/, '/api');
  } else if (originalPath.startsWith('/backend-api')) {
    // Handle edge case without trailing slash
    normalizedPath = originalPath.replace(/^\/backend-api/, '/api');
  }

  if (normalizedPath !== originalPath) {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    req.url = normalizedPath + queryString;
    req.originalUrl = req.originalUrl.replace(originalPath, normalizedPath);
    console.log(`[${timestamp}] 🔄 PATH NORMALIZED: ${originalPath} → ${normalizedPath}`);
  }

  console.log(`[${timestamp}] 🎯 FINAL PATH: ${req.method} ${req.path}`);
  next();
});

// Security middleware
app.use(helmet());

// CORS configuration for Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL ? [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''] : [])
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

// Rate limiting - apply to all routes (Vercel strips /api prefix)
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

// Import routes dynamically
import showRoutes from '../src/routes/shows';
import authRoutes from '../src/routes/auth';
import progressSyncRoutes from '../src/routes/progress-sync';

// IMPORTANT: With proper routing in vercel.json, Vercel preserves /api prefix
// So /api/auth/login arrives as /api/auth/login in Express
// Therefore, mount routes WITH /api prefix

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime()
  });
});

// API routes - mount WITH /api prefix since Vercel preserves the full path
// Route files define: '/login', '/register', etc.
// Mounted at: '/api/auth' (full path: /api/auth/login)
app.use('/api/shows', showRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress-sync', progressSyncRoutes);

// Users endpoint
app.get('/api/users', (req, res) => {
  res.json({
    message: 'Users endpoint - coming soon!',
    data: []
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl} (path: ${req.path})`);
  res.status(404).json({
    success: false,
    error: `Route not found`,
    method: req.method,
    receivedPath: req.path,
    originalUrl: req.originalUrl,
    note: 'Vercel preserves /api prefix, so frontend /api/auth/login arrives as /api/auth/login in Express',
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'GET /api/shows/universal-search',
      'GET /api/shows/popular',
      'POST /api/shows/:tmdbId/quick-add'
    ]
  });
});

// Export for Vercel serverless
export default app;
