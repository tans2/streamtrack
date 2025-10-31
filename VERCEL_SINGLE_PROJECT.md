# 🚀 Single Vercel Project Deployment Guide

This guide covers deploying both your **frontend** (Next.js) and **backend** (Express) as a **single Vercel project** using monorepo support.

---

## 📋 Prerequisites

1. **Vercel CLI installed** (if using CLI)
   ```bash
   npm i -g vercel
   ```
2. **Vercel account** - Sign up at https://vercel.com (free!)
3. **GitHub repository** (optional, but recommended for auto-deployments)

---

## 🎯 Deployment Overview

With this setup, you'll have:
- ✅ **One Vercel project** (simpler management)
- ✅ **One domain** (no CORS issues)
- ✅ **Unified deployment** (frontend and backend deploy together)
- ✅ **Relative API URLs** (no `NEXT_PUBLIC_API_URL` needed)

**Project Structure:**
```
streamtrack/
├── api/
│   └── index.ts          → Serverless function entry (routes to backend)
├── frontend/              → Next.js app
├── backend/               → Express API (used by serverless function)
├── vercel.json            → Root config (handles routing)
└── package.json           → Root workspace config
```

---

## 🚀 Step 1: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New" → "Project"**
3. **Import your Git repository**
4. **Configure project settings**:
   - **Project Name**: `streamtrack` (or your choice)
   - **Root Directory**: Leave as `.` (root) ✅
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `cd frontend && npm run build` (will be auto-filled)
   - **Output Directory**: `frontend/.next` (will be auto-filled)
   - **Install Command**: `cd frontend && npm install && cd ../backend && npm install`

5. **Add Environment Variables**:
   Click "Environment Variables" and add all required vars:
   ```
   NODE_ENV=production
   JWT_SECRET=<your-jwt-secret>
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   TMDB_API_KEY=<your-tmdb-api-key>
   TMDB_BASE_URL=https://api.themoviedb.org/3
   ```
   
   ⚠️ **Note**: You don't need `NEXT_PUBLIC_API_URL` anymore! The frontend uses relative URLs since both are on the same domain.

6. **Deploy**: Click "Deploy"
7. **Wait for deployment** - Vercel will:
   - Install dependencies for both frontend and backend
   - Build the Next.js frontend
   - Set up the Express backend as a serverless function
   - Route `/api/*` requests to the backend

8. **Copy the deployment URL**: You'll get something like `https://streamtrack.vercel.app`

### Option B: Via Vercel CLI

```bash
# From project root
cd /Users/stephanietan/workspace/streamtrack

# Initial deployment
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? streamtrack
# - Directory? ./ (root)
# - Override settings? No (uses vercel.json)

# Add environment variables
vercel env add NODE_ENV
# Enter: production
# Select: Production, Preview, Development

vercel env add JWT_SECRET
# Enter your JWT secret
# Select: Production, Preview, Development

vercel env add SUPABASE_URL
# ... add all required env vars (see list above)

# Deploy to production
vercel --prod
```

---

## ✅ Step 2: Verify Everything Works

1. **Visit your Vercel URL**: `https://your-project.vercel.app`

2. **Test the health endpoint**:
   ```bash
   curl https://your-project.vercel.app/api/health
   ```
   Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "...",
     "environment": "production"
   }
   ```

3. **Test frontend**:
   - Visit `https://your-project.vercel.app`
   - Try signing up / signing in
   - Search for shows
   - Add shows to watchlist

4. **Check browser console** (F12):
   - Verify API calls are using relative URLs (no CORS errors)
   - All requests should go to `/api/*` paths

5. **Test backend API directly**:
   ```bash
   # Test search
   curl https://your-project.vercel.app/api/shows/search?q=breaking+bad
   
   # Test auth (should return 400 without credentials)
   curl -X POST https://your-project.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
   ```

---

## 🔧 How It Works

### Request Routing

1. **Frontend requests** (`/`, `/search`, etc.) → Next.js app
2. **API requests** (`/api/*`) → Express serverless function at `api/index.ts`
3. **Health check** (`/api/health` or `/health`) → Express serverless function

### File Structure

```
streamtrack/
├── api/
│   └── index.ts                    # Root API entry (exports backend app)
├── backend/
│   ├── api/
│   │   └── index.ts                # Backend Express app setup
│   └── src/
│       ├── index.ts               # Express app (exports handler)
│       └── routes/                 # API route handlers
├── frontend/
│   └── src/
│       └── services/
│           └── api.ts             # Uses relative URLs in production
└── vercel.json                     # Root Vercel config
```

### API Client Configuration

The frontend API client (`frontend/src/services/api.ts`) automatically uses:
- **Production**: Relative URLs (`''`) - same domain, no CORS
- **Development**: `NEXT_PUBLIC_API_URL` or `http://localhost:5001`

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? ''  // Same domain - no CORS issues!
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');
```

---

## 📝 Environment Variables Checklist

### Required Variables:
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `TMDB_API_KEY`
- ✅ `TMDB_BASE_URL=https://api.themoviedb.org/3`

### Optional Variables (for development):
- `NEXT_PUBLIC_API_URL` - Only needed if running frontend separately in dev

### ❌ Not Needed:
- `CORS_ORIGIN` - Not needed (same domain)
- `FRONTEND_URL` - Not needed (same domain)
- `NEXT_PUBLIC_API_URL` - Not needed in production (uses relative URLs)

---

## 🐛 Troubleshooting

### Build Issues

**"Cannot find module" errors**
- Ensure both `frontend/` and `backend/` have their `node_modules` installed
- Check that `installCommand` in `vercel.json` installs both:
  ```json
  "installCommand": "cd frontend && npm install && cd ../backend && npm install"
  ```

**"TypeScript compilation errors"**
- Run builds locally first: `npm run build:frontend && npm run build:backend`
- Fix any TypeScript errors before deploying

### Runtime Issues

**"Function not found" or 404 on `/api/*`**
- Verify `api/index.ts` exists in root
- Check `vercel.json` has the function configured:
  ```json
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node",
      "includeFiles": "backend/**"
    }
  }
  ```

**"CORS errors"**
- Shouldn't happen since frontend and backend are on same domain
- If you see CORS errors, check that `API_BASE_URL` is empty in production
- Verify frontend is using relative URLs (check `frontend/src/services/api.ts`)

**"Backend routes not working"**
- Check Vercel function logs: Dashboard → Your Project → Functions → View Logs
- Verify backend routes are properly imported in `backend/api/index.ts`
- Test endpoints directly: `curl https://your-project.vercel.app/api/health`

### API Routing Issues

**"Route not found" errors**
- Verify Express routes are mounted correctly in `backend/api/index.ts`:
  ```typescript
  app.use('/api/shows', showRoutes);
  app.use('/api/auth', authRoutes);
  ```

**"404 on all API endpoints"**
- Check that `api/index.ts` in root correctly exports the backend app
- Verify the Express app is exported as default in `backend/api/index.ts`

---

## 🔄 Updating Your Deployment

### Automatic Deployments (if connected to GitHub)
- Push to `main` branch → Auto-deploys to production
- Create pull request → Auto-creates preview deployment

### Manual Deployments
```bash
# From project root
vercel --prod
```

### View Logs
```bash
# All logs
vercel logs

# Follow logs in real-time
vercel logs --follow
```

### List Environment Variables
```bash
vercel env ls
```

### Update Environment Variable
```bash
vercel env add VARIABLE_NAME
# Follow prompts to set value and environments
```

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Frontend & Backend: `https://your-project.vercel.app`
- ✅ API endpoints: `https://your-project.vercel.app/api/*`
- ✅ Health check: `https://your-project.vercel.app/api/health`
- ✅ Automatic deployments on Git push
- ✅ Preview deployments for pull requests
- ✅ HTTPS by default
- ✅ Global CDN distribution

Your StreamTrack app is now live on Vercel with a single project! 🚀

---

## 🆚 Single Project vs. Separate Projects

### Advantages of Single Project:
- ✅ Simpler setup (one project, one domain)
- ✅ No CORS configuration needed
- ✅ Unified environment variables
- ✅ Single deployment pipeline
- ✅ Easier debugging (all logs in one place)

### When to Use Separate Projects:
- You need different scaling for frontend vs. backend
- You want completely independent deployments
- You're using different teams for frontend/backend

For most use cases, **single project is recommended**! ✨

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Monorepo Support](https://vercel.com/docs/monorepos)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

