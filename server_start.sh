#!/bin/bash

# Load configuration from config.json
CONFIG_FILE="$(pwd)/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Configuration file not found: $CONFIG_FILE"
  exit 1
fi
HOST=$(jq -r '.backend.host' $CONFIG_FILE)
PORT=$(jq -r '.backend.port' $CONFIG_FILE)

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}
# Start the FastAPI server
cd backend
uvicorn "app.app:app" --host $HOST --port $PORT & 
cd ..

# Start the Next.js UI
cd frontend
npm run dev
cd ..
