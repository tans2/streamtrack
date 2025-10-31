# 📤 How to Share Your StreamTrack App

This guide will help you create a shareable link so your friends can test your app without needing a domain.

## 🚀 Quick Start (Recommended: Cloudflare Tunnel)

### Option 1: Automated Script (Easiest)

1. **Make sure both servers are running:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev il
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Run the share script:**
   ```bash
   ./share-tunnel.sh
   ```

3. **Follow the instructions** - The script will:
   - Install cloudflared if needed
   - Create secure tunnels for both frontend and backend
   - Give you shareable URLs

4. **Update your frontend API URL:**
   The script will show you the backend tunnel URL. Update your frontend `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=<backend-tunnel-url>
   ```
   
   Then restart your frontend server.

5. **Share the frontend URL** with your friends!

---

## 🔧 Alternative Options

### Option 2: Using ngrok (Requires signup but more reliable)

1. **Sign up at https://ngrok.com** (free account)

2. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

3. **Authenticate:**
   ```bash
   ngrok config add-authtoken <your-token>
   ```

4. **Start tunnels in separate terminals:**
   ```bash
   # Terminal 1 - Backend
   ngrok http 5001
   
   # Terminal 2 - Frontend
   ngrok http 3000
   ```

5. **Update frontend `.env.local`** with the backend ngrok URL

6. **Share the frontend ngrok URL**

### Option 3: Using localtunnel (No signup, easy)

1. **Install localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start tunnels:**
   ```bash
   # Terminal 1 - Backend
   lt --port 5001
   
   # Terminal 2 - Frontend
   lt --port 3000
   ```

3. **Update frontend `.env.local`** with the backend URL

4. **Share the frontend URL**

---

## ⚠️ Important Notes

### Security Considerations

- **These tunnels are temporary** - URLs change when you restart
- **Don't use for production** - These are for testing only
- **API keys are exposed** - Make sure your `.env` doesn't contain sensitive production keys

### Performance

- Tunnels may be slower than localhost
- Free tunnels may have rate limits
- Connection quality depends on your internet speed

### For Production

For a permanent solution, consider:
- **Vercel** (Free, perfect for Next.js) - gives you `yourapp.vercel.app`
- **Railway** or **Render** (Free tiers available)
- **Netlify** (Free tier)

---

## 🐛 Troubleshooting

### "Port already in use"
Make sure no other services are using ports 3000 or 5001:
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5001

# Kill the process if needed
kill -9 <PID>
```

### "Cloudflared not found"
The script will try to install it automatically. If it fails, install manually:
- **macOS**: `brew install cloudflare/cloudflare/cloudflared`
- **Linux**: See https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Frontend can't connect to backend
1. Make sure backend tunnel is running
2. Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. Restart frontend server

### Friends get "Tunnel not found"
Tunnels are temporary. If you restart, you'll get new URLs. Share the new URLs with friends.

---

## 📝 Quick Reference

```bash
# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev

# Share (in another terminal)
./share-tunnel.sh
```

Happy sharing! 🎉


