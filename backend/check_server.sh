#!/bin/bash

# Check if server is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Server is running on http://localhost:8000"
else
    echo "❌ Server is not running. Starting server..."
    ./start_server.sh &
    sleep 5
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Server started successfully"
    else
        echo "❌ Failed to start server"
    fi
fi
