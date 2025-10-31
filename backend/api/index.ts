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
// Vercel routes /api/* requests to api/index.ts
// The path should be preserved (e.g., /api/auth/login arrives as /api/auth/login)
// However, we handle edge cases where the prefix might be stripped
app.use((req, res, next) => {
  const originalPath = req.path;
  const originalUrl = req.originalUrl;
  
  // Check if path needs normalization
  // Only add /api prefix if it's missing AND it looks like an API route
  const isApiRoute = originalPath.startsWith('/auth') || 
                     originalPath.startsWith('/shows') || 
                     originalPath.startsWith('/progress-sync') || 
                     originalPath.startsWith('/users');
  
  const hasApiPrefix = originalPath.startsWith('/api/') || 
                       originalPath === '/api' ||
                       originalPath.startsWith('/api');
  
  // If it's an API route but missing /api prefix, add it
  if (isApiRoute && !hasApiPrefix) {
    // Preserve query string if present
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    req.url = '/api' + originalPath + queryString;
    req.originalUrl = '/api' + originalUrl;
    console.log(`[Path Normalization] ${originalPath} → /api${originalPath}`);
  }
  
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

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

// Health check endpoint (moved to /api/health for consistency)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime()
  });
});

// Also support /health for backward compatibility (redirects to /api/health)
app.get('/health', (req, res) => {
  res.redirect(301, '/api/health');
});

// API routes - mount at /api prefix
// These routes are defined with paths like '/login', '/register', etc. in the route files
// When mounted at /api/auth, the full path becomes /api/auth/login
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
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    method: req.method,
    path: req.path,
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


