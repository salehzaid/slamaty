#!/bin/bash
# Build frontend with production API URL
export VITE_API_URL=https://qualityrounds-production.up.railway.app
npm ci
npm run build

# Start backend (use uvicorn for robust startup)
cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers
