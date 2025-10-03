# Multi-stage Dockerfile: build frontend, then backend

# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Backend runtime stage
FROM python:3.11-slim
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

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

# Copy start script so Railway startCommand can run it when using Docker
COPY start.sh ./
RUN chmod +x ./start.sh

# Env
ENV PORT=8000
EXPOSE 8000

# Start using start.sh (build/start logic lives there)
CMD ["./start.sh"]
