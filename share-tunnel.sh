#!/bin/bash

# StreamTrack Share Tunnel Script
# This script uses Cloudflare Tunnel to share your app with friends
# No signup required, completely free!

set -e

echo "🌐 StreamTrack Share Tunnel Setup"
echo "=================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "⚠️  cloudflared is not installed."
    echo ""
    echo "Installing cloudflared..."
    
    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install cloudflare/cloudflare/cloudflared
        else
            echo "❌ Please install Homebrew first, or install cloudflared manually:"
            echo "   Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Installing cloudflared on Linux..."
        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared.deb || sudo apt-get install -f -y
        rm cloudflared.deb
    else
        echo "❌ Unsupported OS. Please install cloudflared manually:"
        echo "   Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
fi

echo "✅ cloudflared is installed"
echo ""

# Check if servers are running
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

FRONTEND_PORT=3000
BACKEND_PORT=5001

echo "🔍 Checking if servers are running..."
if ! check_port $FRONTEND_PORT; then
    echo "⚠️  Frontend server is not running on port $FRONTEND_PORT"
    echo "   Please start it with: cd frontend && npm run dev"
    exit 1
fi

if ! check_port $BACKEND_PORT; then
    echo "⚠️  Backend server is not running on port $BACKEND_PORT"
    echo "   Please start it with: cd backend && npm run dev"
    exit 1
fi

echo "✅ Both servers are running"
echo ""

# Start tunnels
echo "🚀 Starting Cloudflare Tunnels..."
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   Backend:  http://localhost:$BACKEND_PORT"
echo ""
echo "⏳ Creating secure tunnel connections..."
echo "   (This may take a few seconds...)"
echo ""

echo "🚀 Starting Cloudflare Tunnels..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 STEP 1: Starting Frontend Tunnel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Open a NEW terminal and run:"
echo "   cloudflared tunnel --url http://localhost:$FRONTEND_PORT"
echo ""
echo "Copy the URL it shows (e.g., https://xxxx.trycloudflare.com)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 STEP 2: Starting Backend Tunnel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Open ANOTHER terminal and run:"
echo "   cloudflared tunnel --url http://localhost:$BACKEND_PORT"
echo ""
echo "Copy this URL too!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 STEP 3: Update Frontend Config"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Update frontend/.env.local with:"
echo "   NEXT_PUBLIC_API_URL=<backend-tunnel-url>"
echo ""
echo "2. Restart your frontend server"
echo ""
echo "3. Share the frontend tunnel URL with friends!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 TIP: Keep all terminals open while testing"
echo ""

# Simpler approach: just show instructions
# User runs tunnels manually in separate terminals for better control

