#!/usr/bin/env sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Deploying backend from repo root (expected Vercel Root Directory: backend)..."
vercel --prod
