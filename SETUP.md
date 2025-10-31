# 🚀 StreamTrack Complete Setup Guide

## 🎯 What We've Built

StreamTrack now has a complete backend infrastructure for streaming content tracking:

- ✅ **Express Backend** with TypeScript
- ✅ **TMDB API Service** for TV show data
- ✅ **Database Service** for Supabase integration
- ✅ **Show Management** endpoints
- ✅ **Search & Discovery** functionality
- ✅ **Next.js Frontend** with Tailwind CSS

## 📋 Prerequisites

1. **Node.js 18+** ✅ (Already installed)
2. **Supabase Account** (Need to create)
3. **TMDB API Key** (Need to get)

## 🔧 Step-by-Step Setup

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended)
4. Create new project: `streamtrack`
5. Save your database password
6. Go to **Settings → API** and copy:
   - Project URL
   - anon public key
   - service_role key

### Step 2: Get TMDB API Key
1. Go to [themoviedb.org](https://themoviedb.org)
2. Create account and verify email
3. Go to **Settings → API**
4. Request API key (Developer option)
5. Copy your API key

### Step 3: Configure Environment
1. Copy the environment template:
   ```bash
   cp backend/env.example backend/.env
   ```

2. Edit `backend/.env` with your credentials:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   TMDB_API_KEY=your_tmdb_api_key_here
   ```

### Step 4: Set Up Database
1. Go to your Supabase project dashboard
2. Click **SQL Editor**
3. Run the database schema from `docs/supabase-setup.md`

### Step 5: Test Everything
1. **Test TMDB API:**
   ```bash
   cd backend
   npm run test:services
   ```

2. **Start the backend:**
   ```bash
   npm run dev:backend
   ```

3. **Test API endpoints:**
   ```bash
   # Popular shows
   curl http://localhost:5001/api/shows/popular
   
   # Search shows
   curl "http://localhost:5001/api/shows/search?q=stranger+things"
   
   # Show details
   curl http://localhost:5001/api/shows/1399
   ```

4. **Start the frontend:**
   ```bash
   npm run dev:frontend
   ```

## 🎬 Available API Endpoints

### Shows
- `GET /api/shows/popular` - Popular TV shows
- `GET /api/shows/search?q={query}` - Search shows
- `GET /api/shows/{tmdbId}` - Show details
- `GET /api/shows/trending/daily` - Daily trending shows
- `GET /api/shows/genre/{genreId}` - Shows by genre

### Health Check
- `GET /health` - Backend status

## 🧪 Testing Your Setup

### Quick Test Commands
```bash
# Test TMDB API
curl "http://localhost:5001/api/shows/popular?limit=3"

# Test search
curl "http://localhost:5001/api/shows/search?q=breaking+bad"

# Test show details
curl http://localhost:5001/api/shows/1399
```

### Expected Results
- **Popular shows**: List of current popular TV shows
- **Search**: Shows matching your search query
- **Show details**: Complete information about a specific show

## 🚨 Troubleshooting

### Common Issues

1. **Port 5000 in use**: Backend now uses port 5001
2. **TMDB API errors**: Check your API key is correct
3. **Database errors**: Verify Supabase credentials
4. **CORS issues**: Frontend should be on port 3000

### Debug Commands
```bash
# Check backend logs
cd backend && npm run dev

# Test services individually
cd backend && npm run test:services

# Check environment variables
cd backend && cat .env
```

## 🎉 What's Next?

Once everything is working:

1. **Build the frontend** to display shows
2. **Add user authentication**
3. **Implement show following**
4. **Add notifications system**
5. **Deploy to production**

## 📚 Documentation

- **Supabase Setup**: `docs/supabase-setup.md`
- **TMDB Setup**: `docs/tmdb-setup.md`
- **API Reference**: Check the routes in `backend/src/routes/`

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check the backend logs for error messages
4. Ensure both Supabase and TMDB accounts are active

---

**Happy streaming! 🎬✨**




