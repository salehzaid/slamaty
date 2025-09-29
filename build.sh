#!/bin/bash
# Build frontend
npm ci
npm run build

# Start backend
cd backend && python3 main.py
