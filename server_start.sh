#!/bin/bash
HOST=$(jq -r '.backend.host' $CONFIG_FILE)
PORT=$(jq -r '.backend.port' $CONFIG_FILE)

# Start the FastAPI server
cd backend
uvicorn "app.app:app" --host $HOST --port $PORT & 
cd ..

# Start the Next.js UI
cd frontend
npm run dev
cd ..
