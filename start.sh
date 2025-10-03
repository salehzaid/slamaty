#!/bin/bash
# Start script used by Railway when Dockerfile is present
# Build frontend (if dist missing) and start backend
if [ ! -d "dist" ]; then
  echo "dist not found, building frontend"
  npm ci --silent
  npm run build
fi

# Start backend using python3
cd backend || exit 1
python3 main.py
