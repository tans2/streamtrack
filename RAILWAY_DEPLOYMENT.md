# 🚂 Deploy Backend to Railway - Complete Guide

Railway is perfect for deploying Node.js backends - it's simple, fast, and has a generous free tier.

---

## 📋 Prerequisites

1. **Railway account** - Sign up at https://railway.app (free!)
2. **Your backend code ready** (you have this!)
3. **Environment variables** - You'll set these in Railway

---

## 🚀 Method 1: Deploy via Railway Dashboard (Easiest)

### Step 1: Sign Up / Sign In to Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub (recommended) or email

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"** (recommended)
   - Connect your GitHub account if not already connected
   - Select your repository
   - Railway will detect it's a Node.js project

   OR

   Select **"Empty Project"** and we'll deploy manually

### Step 3: Configure the Service

**If you deployed from GitHub:**

1. Railway should auto-detect your `backend` folder
2. If not, click on the service → Settings → 
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

**If you created an Empty Project:**

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Click on the service → Settings →
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Step 4: Set Environment Variables

1. Click on your service in Railway
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add each of these (get values from your local `.env` file):

```
PORT=5001
NODE_ENV=production
JWT_SECRET=<your-jwt-secret>
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
TMDB_API_KEY=<your-tmdb-api-key>
TMDB_BASE_URL=https://api.themoviedb.org/3
UNOGS_API_KEY=<your-unogs-api-key>
REELGOOD_API_KEY=<your-reelgood-api-key>
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Important notes:**
- Replace `<your-...>` with actual values from your local `.env`
- `FRONTEND_URL` and `CORS_ORIGIN` should be your Vercel frontend URL
- You can add variables one by one, or click "Raw Editor" to paste multiple

### Step 5: Generate Public URL

1. Click on your service
2. Go to **"Settings"** tab
3. Scroll down to **"Networking"**
4. Click **"Generate Domain"**
5. Railway will create a URL like: `https://your-backend-production.up.railway.app`

**🎉 This is your backend URL!**

### Step 6: Deploy

1. Railway will automatically start building and deploying
2. Watch the logs in the **"Deployments"** tab
3. Wait for it to say **"Success"**

### Step 7: Test Your Backend

1. Visit your Railway URL: `https://your-backend-production.up.railway.app/health`
2. You should see:
   ```json
   {
     "status": "OK",
     "timestamp": "...",
     "uptime": ...,
     "environment": "production"
   }
   ```

---

## 🔧 Method 2: Deploy via Railway CLI (Optional)

If you prefer command line:

### Step 1: Install Railway CLI

```bash
# macOS
brew install railway

# Or download from: https://docs.railway.app/develop/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

### Step 3: Initialize Project

```bash
cd backend
railway init
```

Follow the prompts:
- Create new project or link existing
- Name your project

### Step 4: Set Environment Variables

```bash
# Option A: Set individually
railway variables set JWT_SECRET="your-secret"
railway variables set SUPABASE_URL="your-url"
# ... etc

# Option B: Set from .env file (if you have one)
railway variables set --from-env
```

**Or set via dashboard** (easier for many variables):
- Go to Railway Dashboard → Your Project → Variables
- Add all variables there

### Step 5: Deploy

```bash
railway up
```

This will:
- Build your project
- Deploy to Railway
- Show you the deployment URL

### Step 6: Get Public URL

```bash
railway domain
```

Or generate one in the dashboard (see Method 1, Step 5).

---

## ✅ Step 8: Update Frontend to Use Railway Backend

Now that your backend is deployed, update your Vercel frontend:

### Update Vercel Environment Variable

```bash
cd frontend
vercel env rm NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_API_URL
```

When prompted:
- **Value**: Enter your Railway URL (e.g., `https://your-backend-production.up.railway.app`)
- **Environments**: Select all (Production, Preview, Development)

### Redeploy Frontend

```bash
vercel --prod
```

---

## 🔍 Step 9: Verify Everything Works

1. **Test backend directly:**
   ```
   https://your-backend.railway.app/health
   ```

2. **Test from frontend:**
   - Visit your Vercel URL
   - Try signing up/logging in
   - Check browser console for errors

3. **Check Railway logs:**
   - Railway Dashboard → Your Service → Logs
   - Should show incoming requests

---

## 🎯 Quick Reference

### Railway Dashboard URLs
- **Dashboard**: https://railway.app/dashboard
- **Project Settings**: Dashboard → Your Project → Settings
- **Environment Variables**: Dashboard → Your Project → Variables
- **Logs**: Dashboard → Your Project → Deployments → [Latest] → View Logs

### Common Railway CLI Commands

```bash
# Login
railway login

# Initialize project
railway init

# Set environment variable
railway variables set KEY="value"

# View variables
railway variables

# Deploy
railway up

# View logs
railway logs

# Generate domain
railway domain

# Open in browser
railway open
```

---

## 🐛 Troubleshooting

### Build Failing

**Error: "Cannot find module"**
- Make sure all dependencies are in `dependencies` (not `devDependencies`)
- Check Railway build logs for missing packages

**Error: "Command failed"**
- Verify build command: `npm run build`
- Check that `tsconfig.json` is correct
- Ensure TypeScript compiles successfully locally first

### Runtime Errors

**Error: "Cannot connect to database"**
- Check your `SUPABASE_URL` and keys are correct
- Verify Supabase project is active
- Check Railway logs for specific error

**Error: "CORS errors"**
- Update `CORS_ORIGIN` and `FRONTEND_URL` in Railway variables
- Make sure they match your Vercel frontend URL exactly (including `https://usp`)

**Error: "Port already in use"**
- Railway sets PORT automatically - don't hardcode it
- The code already uses `process.env.PORT || 5001` which is correct

### Check Logs

Railway Dashboard → Your Service → **Deployments** → Click latest deployment → **View Logs**

This shows:
- Build output
- Runtime errors
- Request logs

---

## 💰 Railway Pricing

**Free Tier includes:**
- $5/month in credits (plenty for development/testing)
- Automatic HTTPS
- Custom domains
- Environment variables
- Logs and monitoring

**For production with more traffic**, paid plans start at $20/month.

---

## 🔄 Updating Your Backend

### Automatic Updates (if connected to GitHub)
- Push to your main branch
- Railway auto-deploys the latest code
- No manual steps needed!

### Manual Updates
```bash
cd backend
railway up
```

---

## 🎉 You're Done!

**Your backend is now live at:**
```
https://your-backend-production.up.railway.app
```

**Update your frontend to use it** (see Step 8 above), and you're all set!

---

## 📝 Checklist

- [ ] Railway account created
- [ ] Project created in Railway
- [ ] Service configured (root: `backend`, build: `npm run build`, start: `npm start`)
- [ ] All environment variables set
- [ ] Public domain generated
- [ ] Deployment successful
- [ ] Health check works (`/health` endpoint)
- [ ] Frontend updated with Railway URL
- [ ] Tested end-to-end (sign up, login, etc.)

---

Need help? Check Railway docs: https://docs.railway.app


