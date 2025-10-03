#!/bin/bash
# Build frontend with production API URL
export VITE_API_URL=https://qualityrounds-production.up.railway.app
npm ci --silent
npm run build

# Install backend Python deps (ensure uvicorn available) and start backend
cd backend || exit 1
python3 -m pip install --upgrade pip setuptools wheel || true
python3 -m pip install --no-cache-dir -r requirements.txt || true
# Start uvicorn
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers
