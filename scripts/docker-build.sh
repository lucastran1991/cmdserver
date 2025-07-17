#!/bin/bash
# filepath: /Users/mac/studio/cmdserver/scripts/docker-build.sh

set -e

echo "Building cmdserver Docker images..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Build production image
echo "Building production image..."
docker build -t cmdserver:latest .

# Build development image
echo "Building development image..."
docker build -f Dockerfile.dev -t cmdserver:dev .

echo "Build completed successfully!"
echo ""
echo "To run production: docker-compose up"
echo "To run development: docker-compose -f docker-compose.dev.yml up"