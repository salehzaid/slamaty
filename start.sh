#!/bin/bash
# Start script for Docker container
set -e

echo "Starting application..."

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    echo "Error: backend/main.py not found"
    exit 1
fi

# Load environment variables from env.production if available
if [ -f "backend/env.production" ]; then
    echo "Loading environment variables from env.production..."
    export $(cat backend/env.production | grep -v '^#' | xargs) 2>/dev/null || echo "Some variables may not be set"
fi

# Start backend directly (frontend is already built in Docker)
echo "Starting backend server..."
cd backend
PORT=${PORT:-8000}
# Use uvicorn to serve the FastAPI app directly (ensures predictable behavior in Railway)
exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
