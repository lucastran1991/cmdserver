#!/bin/bash

# Pull latest code
echo "Pulling latest code..."
git pull

# Stop all previous PM2 processes
echo "Stopping all previous PM2 processes..."
pm2 delete all

# --- FRONTEND ---
echo "Starting frontend..."
cd frontend
npm run build
pm2 start npm --name "nextjs-frontend" \
  --output ../out.log --error ../err.log \
  -- start
cd ..

# --- BACKEND ---
echo "Starting backend..."
cd backend
# Don't use & and don't quote the entire command
pm2 start uvicorn --name "fastapi-backend" \
  --interpreter python3 \
  --output ../out.log --error ../err.log \
  -- app.app:app --host 0.0.0.0 --port 8000
cd ..

echo "System started successfully."
