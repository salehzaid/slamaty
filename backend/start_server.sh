#!/bin/bash

# Navigate to backend directory
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend

# Activate virtual environment
source venv/bin/activate

# Start the server
echo "Starting Salamaty Backend Server..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

echo "Server stopped."
