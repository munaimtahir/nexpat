#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Configuration
PROJECT_DIR="/srv/clinicq" # Root directory of your project on the server
FRONTEND_DIR="$PROJECT_DIR/clinicq_frontend" # React project directory

echo "--- Starting ClinicQ Frontend Build ---"

echo "[1/3] Navigating to frontend directory: $FRONTEND_DIR"
cd "$FRONTEND_DIR" || { echo "Failed to navigate to frontend directory. Exiting."; exit 1; }

echo "[2/3] Installing/updating Node.js dependencies"
# Using npm ci for cleaner, reproducible builds in a CI/CD or deployment context
# Ensure package-lock.json is committed to your repository
npm ci

echo "[3/3] Building the React application"
# This command should match the build script in your frontend's package.json
npm run build

echo "--- ClinicQ Frontend Build Complete ---"
echo "Build artifacts are located in $FRONTEND_DIR/dist"

# Note:
# - Ensure this script is executable: chmod +x build_frontend.sh
# - This script builds the frontend. The output (typically in 'dist/') needs to be served by a web server like Nginx.
# - If you integrate your frontend build into Django's static files, this script might be part of
#   your backend deployment process or run before it.
# - For a typical setup, Nginx will be configured to serve the contents of $FRONTEND_DIR/dist.
