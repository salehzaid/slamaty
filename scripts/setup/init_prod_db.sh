#!/bin/bash
# Initialize Production Database on Railway
set -e

echo "🚀 Initializing Production Database..."
echo "================================"

# Go to backend directory
cd backend

# Run the initialization script
python3 init_database.py

echo ""
echo "✅ Database initialization complete!"
echo ""

