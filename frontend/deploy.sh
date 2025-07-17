#!/bin/bash

# Deployment script for EC2
echo "🚀 Starting deployment..."

# Clean up
echo "🧹 Cleaning up old files..."
rm -rf .next
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Kill any existing Next.js processes
    echo "🔄 Stopping existing processes..."
    pkill -f "next start" || true
    pkill -f "node.*next" || true
    
    # Start the application in background
    echo "🚀 Starting the application..."
    nohup npm start > app.log 2>&1 &
    
    # Wait a moment and check if it started
    sleep 3
    
    if pgrep -f "next start" > /dev/null; then
        echo "✅ Application started successfully!"
        echo "🌐 Application should be accessible at:"
        echo "   - http://localhost:8888"
        echo "   - http://$(curl -s http://ifconfig.me):8888"
        echo "   - http://veoliaint.atomiton.com:8888"
        echo ""
        echo "📋 To check logs: tail -f app.log"
        echo "📋 To stop app: pkill -f 'next start'"
    else
        echo "❌ Failed to start application!"
        echo "📋 Check logs: cat app.log"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
