// Root-level API entry point for Vercel serverless function
// This wraps the Express app for Vercel's serverless function format
import app from '../backend/api/index';

// Export as Vercel serverless function handler
// Vercel will automatically route /api/* requests to this function
export default app;

