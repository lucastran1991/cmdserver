#!/bin/bash

# Load configuration from config.json
CONFIG_FILE="$(pwd)/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Configuration file not found: $CONFIG_FILE"
  exit 1
fi
HOST=$(jq -r '.frontend.host' $CONFIG_FILE)
PORT=$(jq -r '.frontend.host' $CONFIG_FILE)

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

cd frontend

if ! command_exists npm; then
  echo "npm not found, please install Node.js and npm."
  exit 1
fi

npm run dev