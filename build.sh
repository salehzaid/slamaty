#!/bin/bash
# Build frontend with production API URL
export VITE_API_URL=https://qualityrounds-production.up.railway.app
npm ci
npm run build

# Start backend
cd backend && python3 main.py
