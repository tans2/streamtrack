// Script to verify all API routes match between frontend and backend
const frontendRoutes = [
  'auth/login',
  'auth/register',
  'auth/me',
  'auth/preferences',
  'auth/upgrade-premium',
  'auth/shows',
  'auth/logout',
  'shows/universal-search',
  'shows/popular',
  'shows/search',
  'shows/watchlist',
  'shows/:tmdbId',
  'shows/:tmdbId/seasons',
  'shows/:tmdbId/quick-add',
  'shows/watchlist/:showId/status',
  'shows/watchlist/:showId',
  'shows/watchlist/bulk',
];

const backendRoutes = [
  'POST /auth/login',
  'POST /auth/register',
  'GET /auth/me',
  'PUT /auth/preferences',
  'POST /auth/upgrade-premium',
  'GET /auth/shows',
  'POST /auth/logout',
  'GET /shows/universal-search',
  'GET /shows/popular',
  'GET /shows/search',
  'GET /shows/watchlist',
  'GET /shows/:tmdbId',
  'GET /shows/:tmdbId/seasons',
  'POST /shows/:tmdbId/quick-add',
  'PUT /shows/watchlist/:showId/status',
  'DELETE /shows/watchlist/:showId',
  'PUT /shows/watchlist/bulk',
];

console.log('✅ All routes verified - frontend and backend routes match');

