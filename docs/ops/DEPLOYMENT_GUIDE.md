# ClinicQ Deployment Guide

This guide provides step-by-step instructions for deploying ClinicQ to production.

## Prerequisites

- Docker and Docker Compose
- A PostgreSQL database (or use the provided Docker container)
- Google Drive service account credentials (JSON file)
- A domain name and SSL certificates (recommended)

## Quick Production Setup

### 1. Environment Configuration

Copy and configure the environment file:

```bash
cp ENV.sample .env
```

Edit `.env` with your production values:

```bash
# Required for production
SECRET_KEY=your_strong_random_secret_key_here
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://username:password@host:5432/dbname
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Google Drive integration
GOOGLE_SERVICE_ACCOUNT_FILE=/run/secrets/gdrive_service_account

# Security (enable for HTTPS)
SECURE_SSL_REDIRECT=true
SECURE_HSTS_SECONDS=31536000
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```

### 2. Google Drive Service Account

1. Create a service account in the Google Cloud Console
2. Download the JSON credentials file
3. Place it at `secrets/gdrive_service_account.json`

```bash
mkdir -p secrets
# Copy your service account file here
cp /path/to/your/service-account.json secrets/gdrive_service_account.json
```

### 3. Build and Deploy

For production deployment with SSL:

```bash
# Build the applications
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start the services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run database migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend python manage.py migrate

# Create a superuser (optional)
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser
```

### 4. Verify Deployment

Test the API endpoints:

```bash
# Health check
curl https://yourdomain.com/api/health/

# Login (should return token)
curl -X POST https://yourdomain.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

Test the frontend:

- Visit `https://yourdomain.com` 
- Try logging in with your credentials
- Navigate to different pages (should not 404 due to nginx SPA fallback)

## Development Setup

For local development:

```bash
# Start development services
docker compose up -d

# The frontend will be available at http://localhost:5173
# The backend API will be available at http://localhost:8000
```

## Troubleshooting

### CORS Issues

If you get CORS errors:

1. Check that `CORS_ALLOWED_ORIGINS` includes your frontend domain
2. Ensure the backend is accessible from the frontend
3. Verify `CORS_ALLOW_CREDENTIALS=True` in settings

### Authentication Issues

If login fails:

1. Verify the frontend is sending `Authorization: Token <token>`
2. Check that the backend has `rest_framework.authtoken` in `INSTALLED_APPS`
3. Ensure the user exists and has the correct group membership

### Google Drive Upload Issues

If prescription uploads fail:

1. Verify the service account JSON is mounted correctly
2. Check that `GOOGLE_SERVICE_ACCOUNT_FILE` environment variable is set
3. Ensure the service account has access to Google Drive API

### Frontend Routing Issues

If refreshing frontend routes returns 404:

1. Verify `nginx.conf` includes `try_files $uri $uri/ /index.html;`
2. Check that the nginx config is being copied in the Dockerfile
3. Ensure the frontend is built with the correct base URL

## Security Checklist

Before going to production:

- [ ] Set `DJANGO_DEBUG=false`
- [ ] Use a strong, random `SECRET_KEY`
- [ ] Configure `DJANGO_ALLOWED_HOSTS` properly
- [ ] Set all security headers appropriately
- [ ] Use HTTPS and set `SECURE_SSL_REDIRECT=true`
- [ ] Protect the Google Drive service account JSON file
- [ ] Use a dedicated database user with limited permissions
- [ ] Set up monitoring and logging (consider Sentry)

## Monitoring

The application includes JSON logging. You can collect logs with:

```bash
# View backend logs
docker logs clinicq_backend

# View frontend logs  
docker logs clinicq_frontend

# View database logs
docker logs clinicq_db
```

For production, consider setting up:
- Log aggregation (ELK stack, Fluentd, etc.)
- Application monitoring (Sentry, Datadog, etc.)
- Infrastructure monitoring (Prometheus, Grafana, etc.)