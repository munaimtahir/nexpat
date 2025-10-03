#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Configuration
PROJECT_DIR="/srv/clinicq" # Root directory of your project on the server
VENV_DIR="$PROJECT_DIR/venv" # Virtual environment directory
BACKEND_DIR="$PROJECT_DIR/clinicq_backend" # Django project directory
USER="clinicq_service_user" # The user Gunicorn/Django will run as (ensure this user exists and has perms)

echo "--- Starting ClinicQ Backend Deployment ---"

# Ensure the script is not run as root, unless necessary for specific commands (use sudo then)
# if [ "$(id -u)" = "0" ]; then
#   echo "This script should not be run as root directly. Use sudo for specific commands if needed."
#   exit 1
# fi

echo "[1/7] Navigating to project directory: $PROJECT_DIR"
cd "$PROJECT_DIR" || { echo "Failed to navigate to project directory. Exiting."; exit 1; }

echo "[2/7] Pulling latest changes from Git (main branch)"
git checkout main
git pull origin main

echo "[3/7] Activating virtual environment"
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate" || { echo "Failed to activate virtual environment. Ensure it's created at $VENV_DIR"; exit 1; }

echo "[4/7] Installing/updating Python dependencies"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

echo "[5/7] Running Django management commands"
python "$BACKEND_DIR/manage.py" check
python "$BACKEND_DIR/manage.py" makemigrations --noinput
python "$BACKEND_DIR/manage.py" migrate --noinput
python "$BACKEND_DIR/manage.py" collectstatic --noinput --clear # Clear existing static files first

echo "[6/7] Restarting Gunicorn service"
# Ensure the service name matches your systemd service file (e.g., clinicq.service)
sudo systemctl restart clinicq # Or clinicq.service

# Optionally, check status
# sudo systemctl status clinicq --no-pager

echo "[7/7] Backend deployment script finished."
echo "--- ClinicQ Backend Deployment Complete ---"

# Note:
# - Ensure this script is executable: chmod +x deploy_backend.sh
# - This script assumes a systemd service named 'clinicq' manages Gunicorn.
# - Database creation and superuser setup are not handled here; do that once manually or via another script.
# - Environment variables (from .env file) should be loaded by Gunicorn/Django, typically via the systemd service file.
# - Ensure file permissions are correctly set for $USER to read project files and write to necessary log/media dirs.
