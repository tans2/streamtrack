# StreamTrack Development Guide

## 🚀 Quick Start

### Option 1: Use the Startup Script (Recommended)
```bash
./start-dev.sh
```

### Option 2: Manual Startup
```bash
npm run dev
```

## 📋 Port Configuration

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001

## 🔧 Configuration Files

### Frontend Configuration
- **Port**: Set in `frontend/package.json` (`next dev -p 3000`)
- **API Base URL**: All API calls point to `http://localhost:5001`
- **Next.js Config**: `frontend/next.config.js` (no deprecated settings)

### Backend Configuration
- **Port**: Set in `backend/.env` (`PORT=5001`)
- **CORS**: Configured for both `localhost:3000` and `localhost:3001`
- **Environment**: `backend/.env` file with API keys

## 🐛 Troubleshooting

### Port Conflicts
If you get "port already in use" errors:
```bash
# Kill all StreamTrack processes
pkill -f "streamtrack"
pkill -f "nodemon" 
pkill -f "next dev"

# Or use the startup script
./start-dev.sh
```

### Authentication Issues
- Ensure backend is running on port 5001
- Check that `.env` file has correct Supabase credentials
- Verify CORS configuration includes `localhost:3000`

### Frontend Not Loading
- Ensure frontend is running on port 3000
- Check browser console for errors
- Verify API calls are pointing to `localhost:5001`

## 📁 Project Structure

```
streamtrack/
├── frontend/          # Next.js React app (port 3000)
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── contexts/  # React contexts (AuthContext)
│   │   └── services/  # API services
│   └── package.json   # Frontend dependencies
├── backend/           # Express.js API (port 5001)
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── index.ts   # Server entry point
│   ├── .env          # Environment variables
│   └── package.json   # Backend dependencies
└── package.json       # Root package with dev scripts
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Shows
- `GET /api/shows/universal-search` - Search shows
- `POST /api/shows/:tmdbId/quick-add` - Add show to watchlist
- `GET /api/shows/watchlist` - Get user's watchlist

### Health Check
- `GET /health` - Backend health status

## 🧪 Testing

### Backend Health
```bash
curl http://localhost:5001/health
```

### Frontend Access
```bash
curl http://localhost:3000
```

### Authentication Test
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3

FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

## 🎯 Development Workflow

1. **Start Development**: `./start-dev.sh` or `npm run dev`
2. **Frontend**: http://localhost:3000
3. **Backend**: http://localhost:5001
4. **Make Changes**: Both services auto-reload
5. **Test**: Use browser and API tools

## 🚨 Common Issues

### Infinite Loading Loop
- Check AuthContext token verification
- Ensure backend `/api/auth/me` endpoint works
- Verify CORS configuration

### CORS Errors
- Backend CORS includes `localhost:3000`
- Frontend API calls use `localhost:5001`
- Check browser network tab for blocked requests

### Database Connection Issues
- Verify Supabase credentials in `.env`
- Check Supabase project is active
- Ensure RLS policies are configured
