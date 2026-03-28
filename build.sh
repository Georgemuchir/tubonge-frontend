#!/bin/bash

# Render.com build script for Pinglo Frontend
echo "🚀 Starting Pinglo Frontend deployment on Render..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build the React application for staging
echo "🏗️ Building React application..."
npm run build:staging

echo "✅ Frontend build completed successfully!"

# List build output for verification
echo "📁 Build output:"
ls -la dist/