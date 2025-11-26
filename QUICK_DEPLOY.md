# 🚀 Quick Deploy - TL;DR

## Backend Deployment (5 minutes)

1. **Vercel Dashboard** → Add New Project → Import repo
2. **Root Directory**: `backend`
3. **Add Environment Variables**:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-jwt-secret`
   - `SUPABASE_URL=your-supabase-url`
   - `SUPABASE_SERVICE_ROLE_KEY=your-key`
   - `TMDB_API_KEY=your-key`
   - `TMDB_BASE_URL=https://api.themoviedb.org/3`
4. **Deploy** → Copy backend URL (e.g., `https://streamtrack-backend.vercel.app`)

## Frontend Deployment (3 minutes)

1. **Vercel Dashboard** → Add New Project → Import repo (same repo!)
2. **Root Directory**: Leave as root (`.`)
3. **Add Environment Variable**:
   - `NEXT_PUBLIC_API_URL=https://streamtrack-backend.vercel.app` (use your backend URL)
4. **Deploy** → Done! 🎉

## Test

- Backend: `curl https://your-backend.vercel.app/health`
- Frontend: Visit your frontend URL and try logging in

---

**Full guide**: See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.

