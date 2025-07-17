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
    echo "🌟 You can now run: npm start"
else
    echo "❌ Build failed!"
    exit 1
fi
