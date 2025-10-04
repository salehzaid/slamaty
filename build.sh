#!/bin/bash
# Build frontend with production API URL
export VITE_API_URL=https://qpsrounds-production.up.railway.app
npm ci --silent
npm run build

# Start backend using python3 main.py
cd backend || exit 1
python3 main.py
