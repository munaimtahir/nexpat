#!/usr/bin/env bash
set -e

echo "Running entrypoint.sh..."

echo "Applying database migrations..."
python manage.py migrate --no-input

echo "Collecting static files..."
python manage.py collectstatic --no-input --clear

# Create admin user only if it doesn't exist and DJANGO_SUPERUSER_USERNAME is set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ]; then
  echo "Attempting to create superuser $DJANGO_SUPERUSER_USERNAME..."
  python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
username = '${DJANGO_SUPERUSER_USERNAME}';
email = '${DJANGO_SUPERUSER_EMAIL}';
password = '${DJANGO_SUPERUSER_PASSWORD}';
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password);
    print(f'Superuser {username} created successfully.');
else:
    print(f'Superuser {username} already exists.');
" || echo "Warning: Superuser creation failed, but continuing..."
  echo "Superuser creation attempt finished."
else
  echo "DJANGO_SUPERUSER_USERNAME not set, skipping superuser creation."
fi

# Execute the CMD declared in Dockerfile / docker-compose
echo "Executing command: $@"
exec "$@"
