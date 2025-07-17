#!/bin/bash
# filepath: /Users/mac/studio/cmdserver/scripts/docker-run.sh

set -e

# Default to development mode
MODE=${1:-dev}

if [ "$MODE" = "prod" ]; then
    echo "Starting cmdserver in production mode..."
    docker-compose up -d
    echo "Services started. Access:"
    echo "  - Frontend: http://localhost:8888"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
elif [ "$MODE" = "dev" ]; then
    echo "Starting cmdserver in development mode..."
    docker-compose -f docker-compose.dev.yml up -d
    echo "Development services started. Access:"
    echo "  - Frontend: http://localhost:8888"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
else
    echo "Usage: $0 [dev|prod]"
    echo "  dev  - Start in development mode (default)"
    echo "  prod - Start in production mode"
    exit 1
fi