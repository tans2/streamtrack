# 🚀 Quick Share Guide - Share Your App in 3 Steps

## Prerequisites

Make sure both servers are running:
```bash
# Terminal 1: Backend (port 5001)
cd backend && npm run dev

# Terminal 2: Frontend (port 3000)  
cd frontend && npm run dev
```

---

## Step 1: Install Cloudflare Tunnel (One-time setup)

```bash
# macOS (with Homebrew)
brew install cloudflare/cloudflare/cloudflared

# Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

---

## Step 2: Create Tunnels

Open **2 new terminals**:

### Terminal 3: Frontend Tunnel
```bash
cloudflared tunnel --url http://localhost:3000
```
👉 **Copy the URL** it shows (e.g., `https://abc123.trycloudflare.com`)

### Terminal 4: Backend Tunnel
```bash
cloudflared tunnel --url http://localhost:5001
```
👉 **Copy this URL** too (e.g., `https://xyz789.trycloudflare.com`)

---

## Step 3: Update Frontend Config

1. **Update `frontend/.env.local`:**
   ```
   NEXT_PUBLIC_API_URL=https://xyz789.trycloudflare.com
   ```
   (Use the backend tunnel URL from Terminal 4)

2. **Restart your frontend server:**
   - Stop Terminal 2 (Ctrl+C)
   - Start again: `cd frontend && npm run dev`

---

## ✅ Done!

**Share the Frontend Tunnel URL** (from Terminal 3) with your friends!

### Example:
```
Share this with friends: https://abc123.trycloudflare.com
```

---

## 🔄 If You Need New URLs

If you close the tunnel terminals, just run the commands again to get new URLs. Don't forget to update `NEXT_PUBLIC_API_URL` if the backend URL changes!

---

## 💡 Tips

- Keep all 4 terminals open while sharing
- URLs change when you restart tunnels
- Free tunnels may be slower than localhost
- For production, consider Vercel/Netlify instead

---

## 🐛 Troubleshooting

**"cloudflared: command not found"**
→ Install it first (see Step 1)

**"Port already in use"**
→ Make sure servers are running (see Prerequisites)

**Friends can't access**
→ Make sure tunnels are still running and you shared the frontend URL (not backend)


