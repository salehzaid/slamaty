#!/bin/bash

# Script لتشغيل Backend على macOS
# يستخدم python3 بدلاً من python

echo "🚀 Starting Backend..."
echo ""

cd "$(dirname "$0")/backend"

echo "📂 Working directory: $(pwd)"
echo ""

# التحقق من وجود python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found!"
    echo "Please install Python 3 first:"
    echo "  brew install python@3"
    exit 1
fi

# التحقق من وجود virtual environment
if [ -d "../.venv_test" ]; then
    echo "🔧 Using virtual environment: .venv_test"
    source ../.venv_test/bin/activate
fi

echo "🐍 Python version: $(python3 --version)"
echo ""

# التحقق من أن port 8000 غير مستخدم
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8000 is already in use!"
    echo "Stopping existing process..."
    pkill -f "uvicorn main:app"
    sleep 2
fi

echo "✨ Starting Uvicorn server..."
echo "📡 Backend will be available at: http://localhost:8000"
echo "🏥 Health check: http://localhost:8000/api/health"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 -m uvicorn main:app --reload --port 8000 --host 0.0.0.0

