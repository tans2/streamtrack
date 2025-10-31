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

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl || req.url}`, {
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    query: req.query
  });
  next();
});

// Path normalization middleware for Vercel
// Vercel may strip /api prefix when routing to api/index.ts
// This ensures routes work whether path has /api or not
app.use((req, res, next) => {
  // If path doesn't start with /api, but should (for our routes), add it
  // This handles cases where Vercel strips the prefix
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/api') && req.path !== '/api') {
    // Check if this looks like an API route (has /auth, /shows, /progress-sync, etc.)
    if (req.path.startsWith('/auth') || req.path.startsWith('/shows') || req.path.startsWith('/progress-sync') || req.path.startsWith('/health') || req.path.startsWith('/users')) {
      req.url = '/api' + req.url;
      req.originalUrl = '/api' + req.originalUrl;
    }
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// API routes
app.use('/api/shows', showRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress-sync', progressSyncRoutes);

app.get('/api/users', (req, res) => {
  res.json({
    message: 'Users endpoint - coming soon!',
    data: []
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`
  });
});

// Export for Vercel serverless
export default app;

