# Multi-stage Dockerfile: build frontend, then backend

# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --silent
COPY . .
# Cachebust build to force full rebuild on CI when needed
ARG CACHEBUST=2
# Set production API URL for build
ENV VITE_API_URL=https://qpsrounds-production.up.railway.app
RUN npm run build

# Backend runtime stage
FROM python:3.11-slim AS backend
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend

# Copy start script
COPY start.sh ./

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

# Make start script executable
RUN chmod +x start.sh

# Env
ENV PORT=8000
EXPOSE 8000

# Start using start script (Railway will override this with railway.json)
CMD ["./start.sh"]
