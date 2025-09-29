#!/usr/bin/env bash
set -e

echo "Running entrypoint.sh..."

echo "Applying database migrations..."
python manage.py migrate --no-input

echo "Collecting static files..."
python manage.py collectstatic --no-input --clear

# Create admin user only if it doesn't exist or DJANGO_SUPERUSER_USERNAME is set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ]; then
  echo "Attempting to create superuser $DJANGO_SUPERUSER_USERNAME..."
  python manage.py createsuperuser \
      --username "$DJANGO_SUPERUSER_USERNAME" \
      --email    "$DJANGO_SUPERUSER_EMAIL" \
      --no-input || true # Silently ignore if user already exists or other error
  echo "Superuser creation attempt finished."
else
  echo "DJANGO_SUPERUSER_USERNAME not set, skipping superuser creation."
fi

# Execute the CMD declared in Dockerfile / docker-compose
echo "Executing command: $@"
exec "$@"
