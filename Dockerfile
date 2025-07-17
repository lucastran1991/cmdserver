# Multi-stage build for cmdserver application
FROM python:3.13-slim as backend

# Set working directory for backend
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Frontend build stage
FROM node:18-alpine as frontend

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ .

# Build the frontend
RUN npm run build

# Final stage
FROM python:3.13-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    rsync \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend from build stage
COPY --from=backend /app/backend ./backend

# Copy frontend build from build stage
COPY --from=frontend /app/frontend ./frontend

# Copy configuration files
COPY config.json .

# Create necessary directories
RUN mkdir -p /app/logs

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV NODE_ENV=production

# Expose ports
EXPOSE 8000 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1

# Start both services
CMD ["sh", "-c", "cd /app/backend && python -m uvicorn app.app:app --host 0.0.0.0 --port 8000 & cd /app/frontend && npm start"]
