#!/bin/sh
set -e

echo "Frontend container starting..."

# Check if vite executable exists
if [ ! -f "node_modules/.bin/vite" ]; then
  echo "Vite not found. Installing dependencies..."
  # npm install may show an exit handler error but still succeeds in installing
  npm install || true
  
  # Verify vite was actually installed
  if [ ! -f "node_modules/.bin/vite" ]; then
    echo "ERROR: npm install failed to install vite. Trying with --force..."
    rm -rf node_modules package-lock.json
    npm install --force || true
  fi
  
  # Final check
  if [ ! -f "node_modules/.bin/vite" ]; then
    echo "ERROR: Failed to install dependencies. Exiting."
    exit 1
  fi
  echo "Dependencies installed successfully."
else
  echo "Dependencies already installed."
fi

echo "Starting Vite dev server..."
exec "$@"
