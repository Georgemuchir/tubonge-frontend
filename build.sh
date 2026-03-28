#!/bin/bash

# Render.com build script for Pinglo Frontend
echo "🚀 Starting Pinglo Frontend deployment on Render..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build the React application (use staging mode if NODE_ENV=staging)
echo "🏗️ Building React application..."
if [ "${NODE_ENV}" = "staging" ]; then
  npm run build:staging
else
  npm run build
fi

echo "✅ Frontend build completed successfully!"

# List build output for verification
echo "📁 Build output:"
ls -la dist/