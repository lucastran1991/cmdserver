#!/bin/bash
git pull

cd frontend
pm2 stop nextjs-app
npm run build
pm2 start npm --name "nextjs-app" -- start
cd ..

cd backend
pm2 stop fastapi-backend
pm2 start "uvicorn app.app:app --host 0.0.0.0 --port 8000" --interpreter=python3 --name fastapi-backend
cd ..
