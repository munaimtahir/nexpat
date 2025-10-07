# VPS Deployment Guide for IP 172.235.33.181

This guide provides step-by-step instructions for deploying ClinicQ on a Linux VPS server with IP address 172.235.33.181.

## Quick Access URLs

After deployment:
- **Frontend**: http://172.235.33.181:5173
- **Backend API**: http://172.235.33.181:8000
- **Admin Panel**: http://172.235.33.181:8000/admin

## Prerequisites

1. Linux VPS server with IP 172.235.33.181
2. Docker and Docker Compose installed
3. Git installed
4. Ports 8000 and 5173 open in firewall

## Configuration Summary

All configuration files have been updated to work with IP 172.235.33.181:

### Backend Configuration
- **DJANGO_ALLOWED_HOSTS**: Includes `172.235.33.181`
- **CORS_ALLOWED_ORIGINS**: Includes `http://172.235.33.181:5173`
- **CSRF_TRUSTED_ORIGINS**: Includes `http://172.235.33.181` and `https://172.235.33.181`
- **Port**: 8000

### Frontend Configuration
- **VITE_API_BASE_URL**: Points to `http://172.235.33.181:8000`
- **Vite Server**: Configured to listen on `0.0.0.0` (all interfaces)
- **Port**: 5173

## Deployment Methods

### Option 1: Docker Compose (Recommended)

#### Development Mode

```bash
# Clone the repository
git clone https://github.com/munaimtahir/nexpat.git
cd nexpat

# Navigate to infrastructure directory
cd infra

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

Services will be available at:
- Frontend: http://172.235.33.181:5173
- Backend: http://172.235.33.181:8000

#### Production Mode

```bash
cd nexpat/infra

# Create production environment file
cp deploy/.env.example .env

# Edit .env with your production values
nano .env
# Key settings:
# SECRET_KEY=<generate-strong-key>
# DJANGO_DEBUG=False
# DJANGO_ALLOWED_HOSTS=172.235.33.181
# CORS_ALLOWED_ORIGINS=http://172.235.33.181:5173
# VITE_API_BASE_URL=http://172.235.33.181:8000

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser

# Check services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Option 2: Manual Deployment

#### Backend Setup

```bash
cd nexpat/apps/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn

# Set environment variables
export SECRET_KEY="your-secret-key"
export DJANGO_DEBUG=False
export DJANGO_ALLOWED_HOSTS="172.235.33.181"
export CORS_ALLOWED_ORIGINS="http://172.235.33.181:5173"
export CSRF_TRUSTED_ORIGINS="http://172.235.33.181,https://172.235.33.181"

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# For development - use Django dev server
python manage.py runserver 0.0.0.0:8000

# For production - use Gunicorn
gunicorn --bind 0.0.0.0:8000 --workers 3 clinicq_backend.wsgi:application
```

#### Frontend Setup

```bash
cd nexpat/apps/web

# Install dependencies
npm install

# For development - use Vite dev server
VITE_API_BASE_URL=http://172.235.33.181:8000 npm run dev -- --host 0.0.0.0

# For production - build and serve
VITE_API_BASE_URL=http://172.235.33.181:8000 npm run build
# Then serve the dist/ folder with nginx or any static server
```

## Firewall Configuration

Ensure ports are open:

```bash
# For Ubuntu/Debian with ufw
sudo ufw allow 8000/tcp
sudo ufw allow 5173/tcp
sudo ufw status

# For CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload
```

## Verification Steps

### 1. Check Backend Health

```bash
curl http://172.235.33.181:8000/api/health/
# Expected: {"status": "healthy"}
```

### 2. Test Backend API

```bash
# Login endpoint
curl -X POST http://172.235.33.181:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
# Expected: {"token": "..."}
```

### 3. Access Frontend

Open browser and navigate to:
```
http://172.235.33.181:5173
```

You should see the login page. Try logging in with your credentials.

### 4. Check Admin Panel

```
http://172.235.33.181:8000/admin
```

## Troubleshooting

### Issue: Cannot access from external network

**Solution:**
1. Check firewall: `sudo ufw status` or `sudo firewall-cmd --list-all`
2. Check service is listening on all interfaces:
   ```bash
   # For backend
   netstat -tlnp | grep 8000
   # Should show 0.0.0.0:8000
   
   # For frontend
   netstat -tlnp | grep 5173
   # Should show 0.0.0.0:5173
   ```
3. Verify VPS provider's security groups/firewall rules allow incoming traffic on ports 8000 and 5173

### Issue: CORS errors in browser

**Solution:**
1. Verify backend CORS configuration includes `http://172.235.33.181:5173`
2. Check environment variables:
   ```bash
   # If using Docker
   docker-compose exec backend env | grep CORS
   ```
3. Restart backend service after configuration changes

### Issue: Frontend cannot connect to backend

**Solution:**
1. Check VITE_API_BASE_URL in frontend:
   ```bash
   # Development
   cat apps/web/.env
   
   # Production
   cat apps/web/.env.production
   ```
2. Ensure it's set to `http://172.235.33.181:8000`
3. Rebuild frontend after environment changes:
   ```bash
   docker-compose restart frontend
   # or for manual deployment
   npm run build
   ```

### Issue: DisallowedHost error

**Solution:**
1. Add `172.235.33.181` to DJANGO_ALLOWED_HOSTS
2. Check backend .env file or Docker environment
3. Restart backend service

### Issue: Connection refused

**Solution:**
1. Check if services are running:
   ```bash
   docker-compose ps
   # or
   ps aux | grep -E "python|node"
   ```
2. Check logs:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```
3. Verify ports are not already in use:
   ```bash
   sudo lsof -i :8000
   sudo lsof -i :5173
   ```

## Production Considerations

### 1. Use HTTPS

For production, set up SSL/TLS certificates:

```bash
# Install certbot
sudo apt install certbot

# Get certificate (requires domain name)
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx configuration to use SSL
# Update CORS_ALLOWED_ORIGINS to use https://
# Update CSRF_TRUSTED_ORIGINS to use https://
```

### 2. Use a Reverse Proxy

For production, use Nginx as reverse proxy:

```bash
# Copy nginx configuration
sudo cp infra/deploy/clinicq.nginx /etc/nginx/sites-available/clinicq
sudo ln -s /etc/nginx/sites-available/clinicq /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Use Process Manager

For manual deployments, use systemd or supervisor:

```bash
# Copy systemd service file
sudo cp infra/deploy/clinicq.service /etc/systemd/system/

# Enable and start service
sudo systemctl enable clinicq
sudo systemctl start clinicq
sudo systemctl status clinicq
```

### 4. Database Backup

Set up regular database backups:

```bash
# Backup PostgreSQL database
docker-compose exec db pg_dump -U clinicq_user clinicq_db > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20240101.sql | docker-compose exec -T db psql -U clinicq_user clinicq_db
```

## Maintenance

### Update Application

```bash
cd nexpat

# Pull latest changes
git pull origin main

# Rebuild and restart services
cd infra
docker-compose down
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate
```

### Monitor Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Check Service Status

```bash
# Docker services
docker-compose ps

# System resources
docker stats

# Container details
docker-compose exec backend ps aux
```

## Security Checklist

- [ ] Change SECRET_KEY from default value
- [ ] Set DJANGO_DEBUG=False in production
- [ ] Use strong database password
- [ ] Enable HTTPS for production
- [ ] Set up regular database backups
- [ ] Configure firewall to only allow necessary ports
- [ ] Keep system and dependencies updated
- [ ] Set up monitoring and logging
- [ ] Use environment variables for secrets (never commit them)
- [ ] Secure Google Drive service account credentials

## Support

For issues or questions:
1. Check application logs
2. Review troubleshooting section above
3. Verify all configuration files have correct IP and ports
4. Check the main documentation in `/docs` directory
5. Open an issue on GitHub

## Configuration Files Reference

All configuration files with IP 172.235.33.181:

1. **apps/backend/.env** - Backend development environment
2. **apps/backend/clinicq_backend/settings.py** - Django settings with defaults
3. **apps/web/.env** - Frontend development environment
4. **apps/web/.env.production** - Frontend production environment
5. **apps/web/vite.config.js** - Vite dev server configuration
6. **apps/web/nginx.conf** - Frontend nginx configuration
7. **infra/docker-compose.yml** - Development Docker setup
8. **infra/docker-compose.prod.yml** - Production Docker setup
9. **infra/deploy/.env.example** - Production environment template
10. **infra/deploy/clinicq.nginx** - Deployment nginx configuration
11. **ENV.sample** - Root environment template
