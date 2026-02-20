#!/usr/bin/env sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Deploying frontend from repo root (expected Vercel Root Directory: frontend)..."
vercel --prod
