#!/bin/bash
git pull

pm2 delete all

cd frontend
npm run build
pm2 start npm --name "nextjs-frontend" -- start
cd ..

cd backend
pm2 start "uvicorn app.app:app --host 0.0.0.0 --port 8000 &" --interpreter=python3 --name fastapi-backend
cd ..
