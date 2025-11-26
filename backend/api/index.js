// Vercel serverless function entry point
// This file is needed for Vercel to recognize and deploy the Express app

const app = require('../dist/index.js').default;

module.exports = app;

