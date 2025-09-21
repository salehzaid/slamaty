# Salamaty Backend Server Instructions

## Quick Start

### 1. Start the Server
```bash
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend
./start_server.sh
```

### 2. Keep Server Alive (Recommended)
```bash
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend
./keep_alive.sh
```

### 3. Check Server Status
```bash
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend
./check_server.sh
```

## Manual Commands

### Start Server Manually
```bash
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Check if Server is Running
```bash
curl http://localhost:8000/health
```

## Troubleshooting

### If you get "Failed to fetch" error:
1. Check if server is running: `curl http://localhost:8000/health`
2. If not running, start it: `./start_server.sh`
3. If still not working, restart: `./keep_alive.sh`

### If you get authentication errors:
1. Make sure you're logged in to the frontend
2. Check browser console for token issues
3. Try logging out and logging in again

## Server URLs
- Health Check: http://localhost:8000/health
- API Docs: http://localhost:8000/docs
- Main API: http://localhost:8000/
