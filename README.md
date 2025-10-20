# StreamTrack 🎬

A simple streaming content tracking web app built with Next.js and Express.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001
   - Health check: http://localhost:5001/health

## Project Structure

```
streamtrack/
├── backend/          # Express.js API server
├── frontend/         # Next.js React app
└── package.json      # Root package with scripts
```

## Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run build` - Build both applications
- `npm run install:all` - Install all dependencies

## Features

- ✅ Simple Express backend with health check
- ✅ Next.js frontend with Tailwind CSS
- ✅ Working development setup
- ✅ No complex dependencies or imports
- ✅ TMDB API service for TV show data
- ✅ Database service for Supabase integration
- ✅ Show search and discovery endpoints
- ✅ Popular shows and trending content
