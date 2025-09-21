#!/bin/bash

# Keep server alive script
echo "🔄 Starting Salamaty Server Monitor..."

while true; do
    # Check if server is running
    if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "❌ Server is down. Restarting..."
        
        # Kill any existing uvicorn processes
        pkill -f uvicorn
        
        # Wait a moment
        sleep 2
        
        # Start server
        cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend
        source venv/bin/activate
        python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
        
        # Wait for server to start
        sleep 5
        
        # Check if server started successfully
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ Server restarted successfully"
        else
            echo "❌ Failed to restart server"
        fi
    else
        echo "✅ Server is running"
    fi
    
    # Wait 30 seconds before next check
    sleep 30
done
