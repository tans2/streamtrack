// Vercel serverless function entry point
// Import the Express app configuration
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
// IMPORTANT: Need to handle how Vercel routes /api/* to api/index.ts
// Possibility 1: Vercel preserves path → /api/auth/login stays /api/auth/login
// Possibility 2: Vercel strips /api → /api/auth/login becomes /auth/login
// Routes are mounted WITHOUT /api prefix (see lines 124-126), so we strip /api if present
app.use((req, res, next) => {
  const originalPath = req.path;
  
  // Strip /api prefix if present (since routes are mounted without it)
  // This handles both cases: if Vercel preserves it, we strip it; if Vercel already stripped it, no change
  if (originalPath.startsWith('/api/')) {
    const newPath = originalPath.replace(/^\/api/, '');
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    req.url = newPath + queryString;
    req.originalUrl = req.originalUrl.replace(/^\/api/, '');
    console.log(`[Path Normalized] ${originalPath} → ${newPath}`);
  }
  
  console.log(`[Final Path] ${req.method} ${req.path} (original: ${req.originalUrl})`);
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

// IMPORTANT: Vercel strips /api prefix when routing to api/index.ts
// So /api/auth/login becomes /auth/login in Express
// Therefore, mount routes WITHOUT /api prefix

// Health check endpoint
// Frontend calls /api/health, but Express receives /health (Vercel strips /api)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime()
  });
});

// API routes - mount WITHOUT /api prefix since Vercel already strips it
// Route files define: '/login', '/register', etc.
// Mounted at: '/auth' (not '/api/auth')
// Full path becomes: /auth/login (which matches /api/auth/login from frontend after Vercel strips /api)
app.use('/shows', showRoutes);
app.use('/auth', authRoutes);
app.use('/progress-sync', progressSyncRoutes);

// Users endpoint
app.get('/users', (req, res) => {
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
    note: 'Vercel strips /api prefix, so frontend /api/auth/login becomes /auth/login in Express',
    availableRoutes: [
      'GET /api/health → /health',
      'POST /api/auth/login → /auth/login',
      'POST /api/auth/register → /auth/register',
      'GET /api/auth/me → /auth/me',
      'GET /api/shows/universal-search → /shows/universal-search',
      'GET /api/shows/popular → /shows/popular',
      'POST /api/shows/:tmdbId/quick-add → /shows/:tmdbId/quick-add'
    ]
  });
});

// Export for Vercel serverless
export default app;
