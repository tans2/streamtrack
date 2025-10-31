# 🚀 Complete Vercel Deployment Guide

## ✅ Steps 1 & 2 Complete
You've installed Vercel CLI and run `vercel` - great! 

---

## 📝 Step 3: Set Up Environment Variables

You need to configure environment variables in Vercel so your frontend can connect to your backend.

### Option A: Backend Still Running Locally (with Tunnel)

1. **Get your backend URL:**
   - Make sure your backend is running: `cd backend && npm run dev`
   - If using a tunnel: Get the tunnel URL from your cloudflared terminal
   - If backend is on a server: Use that URL

2. **Add environment variable in Vercel:**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   ```
   
   When prompted:
   - **Environment**: Select all (Production, Preview, Development)
   - **Value**: Enter your backend URL (e.g., `https://xyz789.trycloudflare.com` or `http://your-server.com:5001`)

3. **Verify it was added:**
   ```bash
   vercel env ls
   ```

### Option B: Backend Also Deployed (Recommended for Production)

If you want to deploy your backend too, you'll need to:
1. Deploy backend to Railway/Render/Heroku
2. Use that deployed backend URL instead

---

## 🔄 Step 4: Redeploy with Environment Variables

After adding environment variables, you need to redeploy:

```bash
cd frontend
vercel --prod
```

This will:
- ✅ Use the environment variables you just set
- ✅ Deploy to production
- ✅ Give you the final URL

**Or if you want to test in preview first:**
```bash
vercel
# This creates a preview deployment
```

---

## 🌐 Step 5: Get Your Live URL

After deployment, Vercel will show you:

```
🔗  Production: https://your-project-name.vercel.app
```

**This is your shareable URL!** 

You can also find it in:
- Terminal output after `vercel --prod`
- Vercel Dashboard: https://vercel.com/dashboard → Your Project → Domains

---

## ⚙️ Step 6: Configure Additional Settings (Optional)

### Update Build Settings (if needed)

Vercel should auto-detect Next.js, but verify:

1. **In Vercel Dashboard:**
   - Go to your project → Settings → General
   - Build & Development Settings:
     - **Framework Preset**: Next.js
     - **Root Directory**: `frontend` (if deploying from root)
     - **Build Command**: `npm run build` (or `cd frontend && npm-producing build`)
     - **Output Directory**: `.next`

### Add Custom Domain (Later)

1. Vercel Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain
4. Follow DNS setup instructions

---

## 🔍 Step 7: Verify Everything Works

1. **Visit your Vercel URL:**
   ```
   https://your-project-name.vercel.app
   ```

2. **Test key features:**
   - ✅ Sign up / Sign in
   - ✅ Search shows
   - ✅ Add to watchlist
   - ✅ Update watchlist

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for any API errors
   - Verify API calls are going to correct backend URL

---

## 🔧 Troubleshooting

### "Cannot connect to backend"
- **Check environment variable:**
  ```bash
  vercel env ls
  ```
- **Verify backend URL is accessible:**
  - Test in browser: `https://your-backend-url.com/health`
  - Should return JSON with status "OK"

### "Environment variable not working"
- Make sure you selected **all environments** (Production, Preview, Development)
- Redeploy after adding: `vercel --prod`

### "CORS errors"
- Update your backend `cors` settings to include Vercel URL:
  ```typescript
  // backend/src/index.ts
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'https://your-project-name.vercel.app'
    ],
    credentials: true
  }));
  ```

### "Build failing"
- Check Vercel Dashboard → Deployments → View logs
- Common issues:
  - Missing dependencies
  - TypeScript errors
  - Build command incorrect

---

## 📋 Quick Reference Commands

```bash
# Add environment variable
vercel env add NEXT_PUBLIC_API_URL

# List environment variables
vercel env ls

# View environment variable
vercel env pull .env.local

# Deploy to production
vercel --prod

# Deploy preview
vercel

# View deployments
vercel ls

# View project info
vercel inspect
```

---

## 🎉 Next Steps

Once deployed:
1. ✅ Share your Vercel URL with friends!
2. ✅ Monitor usage in Vercel Dashboard
3. ✅ Set up automatic deployments (connect GitHub repo)
4. ✅ Add custom domain when ready

Your app is now live at: `https://your-project-name.vercel.app` 🚀


