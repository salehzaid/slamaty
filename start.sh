#!/bin/bash
# Start script for Docker container
set -e

echo "Starting application..."

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    echo "Error: backend/main.py not found"
    exit 1
fi

# Start backend directly (frontend is already built in Docker)
echo "Starting backend server..."
cd backend
exec python3 main.py
