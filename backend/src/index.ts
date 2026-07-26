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
// PORT is provided via environment variable (standard across deployment platforms)
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CORS_ORIGIN,
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
].filter(Boolean);

// Vercel preview deployments are named "<project>-<hash>-<team>.vercel.app".
// The previous check used `origin.includes('.vercel.app')`, which trusted BOTH
// every other Vercel customer's deployment and any host merely containing that
// substring (e.g. https://evil-vercel.app.attacker.com) — with credentials on.
// This matches the host exactly and only for our own project prefixes.
const VERCEL_PREVIEW_RE = /^https:\/\/([a-z0-9-]+)\.vercel\.app$/i;
const OWN_PREVIEW_PREFIXES = (process.env.VERCEL_PREVIEW_PREFIXES || 'tvscout,streamtrack,scout')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;

  const match = VERCEL_PREVIEW_RE.exec(origin);
  if (!match) return false;

  const host = match[1].toLowerCase();
  return OWN_PREVIEW_PREFIXES.some(prefix => host === prefix || host.startsWith(`${prefix}-`));
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Credential endpoints get a much tighter budget than the general API limit.
// Failed logins/resets are what we're throttling, so successful requests don't
// count — a legitimate user is never locked out by their own activity.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login', credentialLimiter);
app.use('/api/auth/reset-password', credentialLimiter);

// Account creation and reset requests are throttled on all outcomes, since the
// abuse case (signup spam, email enumeration) succeeds rather than fails.
const accountCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please try again later.' }
});
app.use('/api/auth/register', accountCreationLimiter);
app.use('/api/auth/forgot-password', accountCreationLimiter);

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

// Root endpoint (helpful for testing)
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'StreamTrack API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      shows: '/api/shows',
      notifications: '/api/notifications'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import routes
import showRoutes from './routes/shows';
import authRoutes from './routes/auth';
import progressSyncRoutes from './routes/progress-sync';
import notificationRoutes from './routes/notifications';
import groupRoutes from './routes/groups';
import feedbackRoutes from './routes/feedback';
import picksRoutes from './routes/picks';

// API routes
app.use('/api/shows', showRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress-sync', progressSyncRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/picks', picksRoutes);

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

// Export handler for Vercel serverless functions
export default app;

// Start server only if not running as a serverless function (e.g., on Vercel)
// Vercel serverless functions don't use app.listen()
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
app.listen(PORT, () => {
  console.log(`🎬 StreamTrack backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});
}
