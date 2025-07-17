#!/bin/bash

# Deployment script for EC2
echo "🚀 Starting deployment..."

# Debug information
echo "📍 Current directory: $(pwd)"
echo "📍 Node.js version: $(node --version)"
echo "📍 NPM version: $(npm --version)"

# Run debugging script
echo "🔍 Running diagnostics..."
chmod +x debug.sh
./debug.sh

# Test imports
echo "🧪 Testing import resolution..."
node test-imports.js

# Clean up
echo "🧹 Cleaning up old files..."
rm -rf .next
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Verify file structure after install
echo "🔍 Verifying file structure after npm install..."
ls -la src/lib/
ls -la src/app/login/

# Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🌟 You can now run: npm start"
else
    echo "❌ Build failed!"
    echo "🔍 Let's check what went wrong..."
    echo "📂 Current file structure:"
    find src/ -name "*.ts" -o -name "*.tsx" | head -20
    exit 1
fi
