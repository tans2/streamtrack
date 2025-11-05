// Root-level API entry point for Vercel serverless function
// This wraps the Express app for Vercel's serverless function format
// vercel.json rewrites route all /api/* requests to this function
import app from '../backend/api/index';

// Export as Vercel serverless function handler
export default app;

