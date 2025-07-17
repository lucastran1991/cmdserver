#!/bin/bash

git stash
git pull
git stash pop

cd frontend
pm2 stop nextjs-app
npm run build
pm2 start npm --name "nextjs-app" -- start
cd ..

cd backend
pm2 stop fastapi-backend
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --interpreter=python3 --name fastapi-backend
cd ..
