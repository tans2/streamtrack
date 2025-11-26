# 🚀 StreamTrack Deployment Guide (Separate Deployments)

This guide covers deploying your frontend and backend as **two separate Vercel projects**.

## 📋 Overview

- **Backend**: Express API deployed as a standalone Vercel project
- **Frontend**: Next.js app deployed as a standalone Vercel project
- **Communication**: Frontend calls backend via environment variable URL

---

## 🔧 Part 1: Deploy Backend

### Step 1: Deploy Backend to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Click "Add New" → "Project"**

3. **Import your GitHub repository**
   - Select your `streamtrack` repository
   - Click "Import"

4. **Configure Backend Project**:
   - **Project Name**: `streamtrack-backend` (or your preference)
   - **Root Directory**: Click "Edit" → Select `backend` folder
   - **Framework Preset**: Other
   - **Build Command**: `npm run build` (should auto-fill)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install` (should auto-fill)

5. **Add Environment Variables** (CRITICAL):
   Click "Environment Variables" and add:
   
   ```
   NODE_ENV=production
   JWT_SECRET=your-secret-key-here
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   TMDB_API_KEY=your-tmdb-api-key
   TMDB_BASE_URL=https://api.themoviedb.org/3
   ```
   
   **Important**: Make sure to use your actual values from your local `.env` file!

6. **Click "Deploy"**

7. **Wait for deployment** (usually 1-2 minutes)

8. **Copy your backend URL**:
   - After deployment, you'll see something like: `https://streamtrack-backend-xyz123.vercel.app`
   - **Copy this URL** - you'll need it for the frontend!

### Step 2: Test Backend Deployment

Test your backend API:

```bash
# Replace with your actual backend URL
curl https://streamtrack-backend-xyz123.vercel.app/health

# Should return:
# {"status":"OK","timestamp":"...","environment":"production","uptime":...}
```

If you see the health check response, your backend is working! 🎉

---

## 🎨 Part 2: Deploy Frontend

### Step 1: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Click "Add New" → "Project"**

3. **Import your GitHub repository AGAIN**
   - Yes, the same repository!
   - Click "Import"

4. **Configure Frontend Project**:
   - **Project Name**: `streamtrack` or `streamtrack-frontend`
   - **Root Directory**: Leave as `.` (root) - the vercel.json handles this
   - **Framework Preset**: Next.js (should auto-detect)
   - **Build Command**: Will use vercel.json config
   - **Output Directory**: Will use vercel.json config
   - **Install Command**: Will use vercel.json config

5. **Add Environment Variable** (CRITICAL):
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_API_URL=https://streamtrack-backend-xyz123.vercel.app
   ```
   
   **Important**: Use the backend URL you copied in Part 1!

6. **Click "Deploy"**

7. **Wait for deployment** (usually 2-3 minutes)

8. **Your app is live!** 🎉
   - You'll get a URL like: `https://streamtrack-abc456.vercel.app`

### Step 2: Test Frontend Deployment

1. Visit your frontend URL in a browser

2. Try to sign up or log in

3. Search for shows

4. Check browser console (F12) - you should see API calls going to your backend URL

---

## 🔄 Part 3: Enable Auto-Deployments

### Backend Auto-Deploy

1. Go to your backend project in Vercel
2. Navigate to "Settings" → "Git"
3. Enable "Production Branch": `main`
4. Enable "Automatic deployments"
5. Now every push to `main` that changes files in `backend/` will auto-deploy!

### Frontend Auto-Deploy

1. Go to your frontend project in Vercel
2. Navigate to "Settings" → "Git"
3. Enable "Production Branch": `main`
4. Enable "Automatic deployments"
5. Now every push to `main` that changes files in `frontend/` will auto-deploy!

---

## 🎯 Part 4: Custom Domains (Optional)

### Backend Domain

1. Go to backend project → "Settings" → "Domains"
2. Add a domain like: `api.yourdomain.com`
3. Follow DNS setup instructions
4. Update frontend environment variable to use new domain

### Frontend Domain

1. Go to frontend project → "Settings" → "Domains"
2. Add a domain like: `yourdomain.com` or `app.yourdomain.com`
3. Follow DNS setup instructions

---

## 📝 Environment Variables Reference

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `TMDB_API_KEY` | Yes | The Movie Database API key |
| `TMDB_BASE_URL` | Yes | `https://api.themoviedb.org/3` |

### Frontend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Your backend Vercel URL |

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: "Function not found" or 500 errors

**Solutions**:
1. Check Vercel function logs: Project → Functions → View Logs
2. Verify all environment variables are set
3. Check that backend built successfully in deployment logs
4. Test `/health` endpoint directly

**Problem**: CORS errors

**Solutions**:
1. Backend already allows `.vercel.app` domains
2. If using custom domain, you may need to update CORS in `backend/src/index.ts`

### Frontend Issues

**Problem**: "Network error" or "API endpoint not found"

**Solutions**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Make sure it includes `https://` and NO trailing slash
3. Check browser console for the actual URL being called
4. Test backend URL directly in browser

**Problem**: 401 errors after login

**Solutions**:
1. Check that JWT_SECRET is the same in backend
2. Verify cookies/tokens are being stored correctly
3. Check backend logs for authentication errors

---

## 🔄 Local Development

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
# Automatically connects to http://localhost:5001 (no env var needed)
```

---

## 📊 Monitoring

### Backend Monitoring
- **Function Logs**: Vercel Dashboard → Backend Project → Functions → View Logs
- **Analytics**: Vercel Dashboard → Backend Project → Analytics
- **Health Check**: `https://your-backend.vercel.app/health`

### Frontend Monitoring
- **Deployment Logs**: Vercel Dashboard → Frontend Project → Deployments
- **Analytics**: Vercel Dashboard → Frontend Project → Analytics
- **Real User Monitoring**: Available on Vercel Pro plan

---

## 💰 Costs

- **Free Tier**: Both projects fit in Vercel's free tier
- **Limits**: 
  - 100GB bandwidth/month (shared across projects)
  - 100 serverless function invocations/day (per project)
  - Should be plenty for testing and small-scale production

---

## ✅ Success Checklist

- [ ] Backend deployed to Vercel
- [ ] Backend `/health` endpoint responds
- [ ] Backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable (`NEXT_PUBLIC_API_URL`) set
- [ ] Can sign up/login on frontend
- [ ] Can search for shows
- [ ] Can add shows to watchlist
- [ ] Auto-deployments enabled for both projects

---

## 🎉 You're Done!

Your StreamTrack app is now live with separate frontend and backend deployments!

**Next Steps:**
- Share your app URL with friends
- Set up custom domains
- Monitor usage and performance
- Keep building features!

---

## 🆘 Need Help?

If you run into issues:
1. Check the Troubleshooting section above
2. Check Vercel function logs for backend errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Test backend health endpoint directly

