# 🚀 Complete Vercel Deployment Guide - Frontend & Backend

This guide covers deploying both your **frontend** (Next.js) and **backend** (Express) to Vercel.

---

## 📋 Prerequisites

1. **Vercel CLI installed** (if using CLI)
   ```bash
   npm i -g vercel
   ```
2. **Vercel account** - Sign up at https://vercel.com (free!)
3. **GitHub repository** (optional, but recommended for auto-deployments)

---

## 🎯 Deployment Strategy

You'll deploy **two separate Vercel projects**:
- **Frontend Project**: Next.js app (deploys from `frontend/` directory)
- **Backend Project**: Express API (deploys from `backend/` directory)

Both will get their own Vercel URLs, and you'll connect them via environment variables.

---

## 🔧 Step 1: Deploy Backend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New" → "Project"**
3. **Import your Git repository** (or drag & drop the `backend/` folder)
4. **Configure project settings**:
   - **Project Name**: `streamtrack-backend` (or your choice)
   - **Root Directory**: Set to `backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty (not used for serverless)
   - **Install Command**: `npm install`
   - **Development Command**: `npm run dev`

5. **Add Environment Variables**:
   Click "Environment Variables" and add all your backend env vars:
   ```
   NODE_ENV=production
   JWT_SECRET=<your-jwt-secret>
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   TMDB_API_KEY=<your-tmdb-api-key>
   TMDB_BASE_URL=https://api.themoviedb.org/3
   CORS_ORIGIN=https://your-frontend.vercel.app (you'll update this after frontend deploys)
   FRONTEND_URL=https://your-frontend.vercel.app (you'll update this after frontend deploys)
   ```

6. **Deploy**: Click "Deploy"
7. **Copy the deployment URL**: You'll get something like `https://streamtrack-backend.vercel.app`

### Option B: Via Vercel CLI

```bash
cd backend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? streamtrack-backend
# - Directory? ./ (or backend)
# - Override settings? No (uses vercel.json)

# Add environment variables
vercel env add JWT_SECRET
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add TMDB_API_KEY
# ... add all required env vars

# Deploy to production
vercel --prod
```

### ✅ Verify Backend Deployment

Test your backend:
```bash
curl https://your-backend-url.vercel.app/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "...",
  "environment": "production"
}
```

---

## 🎨 Step 2: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New" → "Project"**
3. **Import your Git repository** (same repo or separate)
4. **Configure project settings**:
   - **Project Name**: `streamtrack-frontend` (or your choice)
   - **Root Directory**: Set to `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
   ```
   ⚠️ **Important**: Use the backend URL you got from Step 1!

6. **Deploy**: Click "Deploy"
7. **Copy the deployment URL**: You'll get something like `https://streamtrack-frontend.vercel.app`

### Option B: Via Vercel CLI

```bash
cd frontend
vercel

# Follow prompts similar to backend

# Add environment variable (critical!)
vercel env add NEXT_PUBLIC_API_URL
# When prompted, enter: https://your-backend-url.vercel.app
# Select all environments: Production, Preview, Development

# Deploy to production
vercel --prod
```

---

## 🔄 Step 3: Update CORS Settings

After frontend is deployed, update backend CORS to include the frontend URL:

1. **Go to Backend project in Vercel Dashboard**
2. **Environment Variables** → Edit:
   - `CORS_ORIGIN` → `https://your-frontend.vercel.app`
   - `FRONTEND_URL` → `https://your-frontend.vercel.app`
3. **Redeploy backend** (or it will auto-redeploy on next push)

**Via CLI:**
```bash
cd backend
vercel env rm CORS_ORIGIN
vercel env add CORS_ORIGIN
# Enter: https://your-frontend.vercel.app

vercel env rm FRONTEND_URL
vercel env add FRONTEND_URL
# Enter: https://your-frontend.vercel.app

vercel --prod  # Redeploy
```

---

## ✅ Step 4: Verify Everything Works

1. **Visit your frontend URL**: `https://your-frontend.vercel.app`
2. **Test key features**:
   - ✅ Sign up / Sign in
   - ✅ Search shows
   - ✅ Add to watchlist
   - ✅ View profile

3. **Check browser console** (F12):
   - Look for any API errors
   - Verify API calls are going to your backend URL

4. **Test backend directly**:
   ```bash
   curl https://your-backend.vercel.app/health
   curl https://your-backend.vercel.app/api/shows?query=breaking+bad
   ```

---

## 🔧 Project Structure Summary

After deployment, you'll have:

```
streamtrack/
├── frontend/          → Deployed as separate Vercel project
│   ├── vercel.json    → Frontend Vercel config
│   └── ...
├── backend/           → Deployed as separate Vercel project
│   ├── vercel.json    → Backend Vercel config
│   ├── api/
│   │   └── index.ts   → Serverless function entry point
│   └── src/
│       └── index.ts   → Express app (exports handler for serverless)
└── ...
```

---

## 🐛 Troubleshooting

### Backend Issues

**"Function not found" or 404 errors**
- Verify `backend/vercel.json` exists and is correct
- Ensure `backend/api/index.ts` exists and exports the app
- Check Vercel build logs for errors

**"Cannot find module" errors**
- Verify all dependencies are in `dependencies` (not `devDependencies`)
- Check that `npm install` runs successfully in build logs

**"CORS errors"**
- Update `CORS_ORIGIN` and `FRONTEND_URL` environment variables
- Ensure frontend URL is correctly set in backend env vars
- Redeploy backend after updating env vars

### Frontend Issues

**"Cannot connect to backend"**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check that backend URL is accessible (test `/health` endpoint)
- Ensure backend is deployed and running

**"API errors"**
- Check browser console for specific error messages
- Verify backend logs in Vercel Dashboard
- Test backend endpoints directly with `curl`

### Build Issues

**"TypeScript errors"**
- Run `npm run build` locally first to catch errors
- Check that all TypeScript types are correct
- Verify `tsconfig.json` includes all necessary paths

**"Missing dependencies"**
- Ensure all packages are in correct `package.json` files
- Root `package.json` should only have `concurrently`
- Frontend should have only frontend dependencies
- Backend should have only backend dependencies

---

## 🚀 Quick Reference

### Deploy Backend
```bash
cd backend
vercel --prod
```

### Deploy Frontend
```bash
cd frontend
vercel --prod
```

### View Logs
```bash
# Backend logs
cd backend
vercel logs

# Frontend logs
cd frontend
vercel logs
```

### List Environment Variables
```bash
# Backend
cd backend
vercel env ls

# Frontend
cd frontend
vercel env ls
```

---

## 📝 Environment Variables Checklist

### Backend Required Variables:
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `TMDB_API_KEY`
- ✅ `TMDB_BASE_URL=https://api.themoviedb.org/3`
- ✅ `CORS_ORIGIN=https://your-frontend.vercel.app`
- ✅ `FRONTEND_URL=https://your-frontend.vercel.app`

### Frontend Required Variables:
- ✅ `NEXT_PUBLIC_API_URL=https://your-backend.vercel.app`

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Frontend: `https://your-frontend.vercel.app`
- ✅ Backend: `https://your-backend.vercel.app`
- ✅ Automatic deployments on Git push (if connected to GitHub)
- ✅ Preview deployments for pull requests
- ✅ HTTPS by default
- ✅ Global CDN distribution

Your StreamTrack app is now live on Vercel! 🚀

---

## 🔄 Updating Your Deployment

### Automatic Deployments (if connected to GitHub)
- Push to `main` branch → Auto-deploys to production
- Create pull request → Auto-creates preview deployment

### Manual Deployments
```bash
# Backend
cd backend && vercel --prod

# Frontend
cd frontend && vercel --prod
```

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

