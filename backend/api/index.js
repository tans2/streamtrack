// Vercel serverless function entry point
// This file is needed for Vercel to recognize and deploy the Express app

const app = require('../dist/index.js');

// Handle both ES module default export and CommonJS export
module.exports = app.default || app;

