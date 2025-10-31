#!/bin/bash

# StreamTrack Development Startup Script
# This script ensures both frontend and backend start on the correct ports

echo "🎬 Starting StreamTrack Development Environment..."

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "streamtrack" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "concurrently" 2>/dev/null || true

# Wait for processes to fully terminate
sleep 2

# Check if ports are free
if lsof -i :3000 >/dev/null 2>&1; then
    echo "❌ Port 3000 is still in use. Killing processes..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi

if lsof -i :5001 >/dev/null 2>&1; then
    echo "❌ Port 5001 is still in use. Killing processes..."
    lsof -ti :5001 | xargs kill -9 2>/dev/null || true
fi

# Wait for ports to be freed
sleep 2

# Start the development environment
echo "🚀 Starting development servers..."
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5001"
echo ""

# Use the npm script to start both services
npm run dev
