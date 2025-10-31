# 🚀 Vercel Deployment - Step by Step

## ✅ You've Completed Steps 1 & 2
- ✅ Step 1: Installed Vercel CLI
- ✅ Step 2: Ran `vercel` command

---

## 📝 STEP 3: Set Environment Variables

Your frontend needs to know where your backend is. Let's add that URL.

### 3.1: First, decide on your backend setup

**Option A: Using Cloudflare Tunnel (Quick testing)**
- Keep your backend running locally: `cd backend && npm run dev`
- Create a tunnel: `cloudflared tunnel --url http://localhost:5001`
- Copy the tunnel URL it gives you (e.g., `https://xyz-1234.trycloudflare.com`)

**Option B: Deploy backend separately (Recommended)**
- Deploy backend to Railway/Render/Heroku first
- Use that deployed backend URL

### 3.2: Add the environment variable to Vercel

Run this command **in your terminal**:

```bash
vercel env add NEXT_PUBLIC_API_URL
```

**You'll be prompted:**
###### 1️⃣ **What’s the value of NEXT_PUBLIC_API_URL?**
   - **Enter your backend URL** (the tunnel URL or deployed backend URL)
   - Example: `https://xyz-1234.trycloudflare.com`
   - Or: `https://your-backend.railway.app`

###### 2️⃣ **Add NEXT_PUBLIC_API_URL to which Environments?**
   - **Select ALL THREE** by pressing spacebar on each:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Press Enter to confirm

### 3.3: Verify it was added

```bash
vercel env ls
```

You should see:
```
NEXT_PUBLIC_API_URL
  Production: https://your-backend-url.com
  Preview: https://your-backend-url.com
  Development: https://your-backend-url.com
```

---

## 🚀 STEP 4: Deploy to Production

Now deploy your frontend with the environment variables:

```bash
cd frontend
vercel --prod
```

**What happens:**
- ✅ Vercel builds your Next.js app
- ✅ Uses the environment variables you set
- ✅ Deploys to production
- ✅ Shows you the final URL

**You'll see output like:**
```
🔗  Production: https://your-project-name.vercel.app
```

**🎉 This is your live, shareable URL!**

---

## 🌐 STEP 5: Get Your Live URL

After deployment completes, you'll see:

```
✅  Production: https://your-project-name.vercel.app [copied to clipboard]
```

**You can also find it:**
1. **In the terminal** - Right after `vercel --prod` finishes
2. **In Vercel Dashboard**: https://vercel.com/dashboard
   - Click on your project
   - Check the "Domains" section

---

## 🔧 STEP 6: Update Backend CORS (Important!)

Your backend needs to allow requests from your Vercel URL.

### 6.1: Update backend CORS settings

The backend code has been updated to automatically allow Vercel URLs. But if you want to be explicit:

**Option A: Set environment variable when running backend**
```bash
cd backend
CORS_ORIGIN=https://your-project-name.vercel.app npm run dev
```

**Option B: Update backend .env file**
Create or update `backend/.env`:
```
CORS_ORIGIN=https://your-project-name.vercel.app
```

The backend code I updated will automatically allow any `.vercel.app` domain, so this should work automatically!

### 6.2: Restart your backend

If you updated environment variables, restart:
```bash
cd backend
npm run dev
```

---

## ✅ STEP 7: Test Your Live App

### 7.1: Visit your Vercel URL

Open in browser:
```
https://your-project-name.vercel.app
```

### 7.2: Test these features

1. **✅ Sign up** - Create a test account
2. **✅ Sign in** - Log in with your account
3. **✅ Search shows** - Try searching for a show
4. **✅ Add to watchlist** - Add a show
5. **✅ View watchlist** - Check your profile

### 7.3: Check for errors

**Open Browser DevTools (F12):**
- Go to **Console** tab
- Look for any red error messages
- Check **Network** tab to verify API calls are working

**Common issues:**
- ❌ "Cannot connect to backend" → Check Step 3 (environment variables)
- ❌ "CORS error" → Check Step 6 (backend CORS)
- ❌ "404 on API calls" → Verify backend URL is correct

---

## 🔄 STEP 8: Make Future Updates

When you make code changes:

### Deploy updates:
```bash
cd frontend
vercel --prod
```

### Update environment variables:
```bash
# To change the backend URL
vercel env rm NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_API_URL
vercel --prod
```

---

## 📋 Quick Command Reference

```bash
# View all deployments
vercel ls

# View environment variables  
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# Deploy to production
vercel --prod

# Deploy preview
vercel

# View project details
vercel inspect
```

---

## 🎉 Done!

**Share this URL with your friends:**
```
https://your-project-name.vercel.app
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
1. Check environment variable: `vercel env ls`
2. Verify backend is running
3. Test backend URL directly in browser: `https://your-backend-url.com/health`
4. Redeploy: `vercel --prod`

### "CORS errors"
1. The backend code I updated should auto-allow Vercel URLs
2. If still having issues, make sure backend is running with updated code
3. Check browser console for exact error message

### "Environment variable not working"
1. Make sure you selected all environments (Production, Preview, Development)
2. Redeploy after adding: `vercel --prod`
3. Check Vercel Dashboard → Settings → Environment Variables

### Need help?
- Vercel Dashboard: https://vercel.com/dashboard
- Check deployment logs in Vercel Dashboard → Deployments → [Select deployment] → Logs


