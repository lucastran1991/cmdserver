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

# Check if uvicorn is installed, if not, install it
if ! command_exists uvicorn; then
  echo "uvicorn not found, installing..."
  pip3 install uvicorn
  export PATH=$PATH:$(python -m site --user-base)/bin
fi

# Set the PYTHONPATH to the current directory
export PYTHONPATH=$(pwd)/backend

# Activate the virtual environment
source venv/bin/activate

# Start the FastAPI server
uvicorn "app.app:app" --host $HOST --port $PORT