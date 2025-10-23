# Configuration Review Summary - IP 172.235.33.181

This document summarizes all configuration changes made to ensure the application works correctly with VPS IP 172.235.33.181 on ports 8000 (backend) and 5173 (frontend).

## Files Modified

### 1. Backend Configuration Files

#### apps/backend/.env
```env
# Before:
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# After:
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://172.235.33.181:5173
```
**Change**: Added VPS IP with port 5173 to CORS allowed origins

#### apps/backend/clinicq_backend/settings.py
```python
# Before:
_default_cors = "http://localhost:5173,http://127.0.0.1:5173,http://172.235.33.181"

# After:
_default_cors = "http://localhost:5173,http://127.0.0.1:5173,http://172.235.33.181:5173"
```
**Change**: Fixed default CORS to include port :5173 on VPS IP

**Already Correct** (no changes needed):
- `_DEFAULT_ALLOWED_HOSTS` already includes `172.235.33.181`
- `_default_csrf` already includes `http://172.235.33.181,https://172.235.33.181`

### 2. Frontend Configuration Files

#### apps/web/.env
```env
# Before:
VITE_API_BASE_URL=http://127.0.0.1:8000

# After:
# Frontend environment configuration
# Point to the Django backend
# For local development use 127.0.0.1:8000
# For VPS deployment use 172.235.33.181:8000
VITE_API_BASE_URL=http://127.0.0.1:8000
```
**Change**: Added helpful comments for switching between local and VPS deployment

#### apps/web/.env.production (NEW FILE)
```env
# Production configuration for VPS deployment
# Frontend will connect to backend at VPS IP
VITE_API_BASE_URL=http://172.235.33.181:8000

# Optional: Sentry DSN for production error tracking
# VITE_SENTRY_DSN=your_sentry_dsn_here
```
**Change**: Created new production environment file

#### apps/web/vite.config.js
```javascript
// Before:
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})

// After:
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces (allows external access)
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PROXY || 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
```
**Changes**:
- Added `host: '0.0.0.0'` to allow external access
- Added explicit `port: 5173` configuration
- Made proxy target configurable via `VITE_BACKEND_PROXY` environment variable

#### apps/web/nginx.conf
**Already Correct** (no changes needed):
- Server name already set to `172.235.33.181`

### 3. Docker Configuration Files

#### infra/docker-compose.yml

**Backend Service**:
```yaml
# Added:
- CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://172.235.33.181:5173
- CSRF_TRUSTED_ORIGINS=http://172.235.33.181,https://172.235.33.181
```
**Change**: Added CORS and CSRF environment variables with VPS IP

**Frontend Service**:
```yaml
# Before:
command: npm run dev -- --host

# After:
command: npm run dev -- --host 0.0.0.0

# Added:
- VITE_BACKEND_PROXY=http://backend:8000
```
**Changes**:
- Made host explicit (`0.0.0.0`)
- Added `VITE_BACKEND_PROXY` environment variable

#### infra/docker-compose.prod.yml

**Backend Service**:
```yaml
# Before:
- DJANGO_ALLOWED_HOSTS=${DJANGO_ALLOWED_HOSTS}
- CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}

# After:
- DJANGO_ALLOWED_HOSTS=${DJANGO_ALLOWED_HOSTS:-172.235.33.181}
- CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-http://172.235.33.181:5173}
- CSRF_TRUSTED_ORIGINS=${CSRF_TRUSTED_ORIGINS:-http://172.235.33.181,https://172.235.33.181}
```
**Changes**: Added default values with VPS IP

**Frontend Service**:
```yaml
# Before:
- VITE_API_BASE_URL=${VITE_API_BASE_URL:-172.235.33.181:5173}

# After:
- VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://172.235.33.181:8000}
```
**Change**: Fixed URL format (was missing `http://` and had wrong port)

### 4. Environment Template Files

#### ENV.sample
```env
# Before:
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,app.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
CSRF_TRUSTED_ORIGINS=https://app.example.com
VITE_API_BASE_URL=http://localhost:8000

# After:
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,172.235.33.181,app.example.com
CORS_ALLOWED_ORIGINS=http://172.235.33.181:5173,https://app.example.com
CSRF_TRUSTED_ORIGINS=http://172.235.33.181,https://172.235.33.181,https://app.example.com
VITE_API_BASE_URL=http://172.235.33.181:8000
```
**Changes**: Added VPS IP to all relevant configuration fields

#### infra/deploy/.env.example
```env
# Before:
DJANGO_ALLOWED_HOSTS=your_domain.com,www.your_domain.com,localhost,127.0.0.1
# CORS_ALLOWED_ORIGINS=
VITE_API_BASE_URL=http://localhost:8000

# After:
DJANGO_ALLOWED_HOSTS=172.235.33.181,your_domain.com,www.your_domain.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://172.235.33.181:5173,https://your_frontend_domain.com
CSRF_TRUSTED_ORIGINS=http://172.235.33.181,https://172.235.33.181,https://your_frontend_domain.com
VITE_API_BASE_URL=http://172.235.33.181:8000
```
**Changes**: Added VPS IP and uncommented/configured CORS settings

### 5. Deployment Configuration Files

#### infra/deploy/clinicq.nginx
```nginx
# Before:
server_name your_domain.com www.your_domain.com;

# After:
server_name 172.235.33.181 your_domain.com www.your_domain.com;
```
**Change**: Added VPS IP to server_name directive

### 6. Documentation Files

#### docs/ops/VPS_DEPLOYMENT_172.235.33.181.md (NEW FILE)
**Change**: Created comprehensive deployment guide specific to VPS IP 172.235.33.181

## Configuration Matrix

| Component | Configuration | Value |
|-----------|--------------|-------|
| Backend Host | DJANGO_ALLOWED_HOSTS | `172.235.33.181` |
| Backend Port | Port binding | `8000` |
| Backend CORS | CORS_ALLOWED_ORIGINS | `http://172.235.33.181:5173` |
| Backend CSRF | CSRF_TRUSTED_ORIGINS | `http://172.235.33.181, https://172.235.33.181` |
| Frontend Host | Vite server host | `0.0.0.0` (all interfaces) |
| Frontend Port | Port binding | `5173` |
| Frontend API URL | VITE_API_BASE_URL | `http://172.235.33.181:8000` |
| Frontend Nginx | server_name | `172.235.33.181` |
| Docker Backend | Port mapping | `8000:8000` |
| Docker Frontend | Port mapping | `5173:5173` |

## Deployment Readiness Checklist

### Configuration Files
- [x] Backend .env includes VPS IP in CORS with port
- [x] Backend settings.py has correct default CORS with port
- [x] Frontend .env.production created with VPS backend URL
- [x] Vite config listens on all interfaces (0.0.0.0)
- [x] Docker compose files have VPS IP in environment variables
- [x] Environment templates updated with VPS IP
- [x] Nginx configs include VPS IP

### Network Configuration
- [x] Backend configured to listen on 0.0.0.0:8000
- [x] Frontend configured to listen on 0.0.0.0:5173
- [x] CORS allows frontend port (5173)
- [x] CSRF trusts VPS IP

### Directory Structure
- [x] Docker compose paths relative to infra/ directory
- [x] Backend context: ../apps/backend
- [x] Frontend context: ../apps/web
- [x] Secrets path: ./secrets/gdrive_service.json

## Quick Start Commands

### Docker Development
```bash
cd /path/to/nexpat/infra
docker-compose up -d
```

### Docker Production
```bash
cd /path/to/nexpat/infra
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Manual Backend
```bash
cd /path/to/nexpat/apps/backend
export CORS_ALLOWED_ORIGINS="http://172.235.33.181:5173"
python manage.py runserver 0.0.0.0:8000
```

### Manual Frontend
```bash
cd /path/to/nexpat/apps/web
export VITE_API_BASE_URL="http://172.235.33.181:8000"
npm run dev -- --host 0.0.0.0
```

## Access URLs

After deployment on VPS with IP 172.235.33.181:

- **Frontend**: http://172.235.33.181:5173
- **Backend API**: http://172.235.33.181:8000
- **Backend Admin**: http://172.235.33.181:8000/admin
- **API Health Check**: http://172.235.33.181:8000/api/health/

## Verification Commands

```bash
# Test backend health
curl http://172.235.33.181:8000/api/health/

# Test CORS headers
curl -H "Origin: http://172.235.33.181:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://172.235.33.181:8000/api/auth/login/ -v

# Check if ports are listening
netstat -tlnp | grep -E "8000|5173"
```

## Troubleshooting Quick Reference

| Issue | Check | Solution |
|-------|-------|----------|
| CORS error | Backend logs | Verify CORS_ALLOWED_ORIGINS includes `http://172.235.33.181:5173` |
| Cannot connect to backend | Frontend .env | Ensure VITE_API_BASE_URL is `http://172.235.33.181:8000` |
| DisallowedHost error | Backend config | Add `172.235.33.181` to DJANGO_ALLOWED_HOSTS |
| Connection refused | Firewall | Open ports 8000 and 5173 |
| Not accessible externally | Server binding | Ensure services listen on 0.0.0.0 not 127.0.0.1 |

## Next Steps

1. **On VPS Server (172.235.33.181)**:
   - Ensure Docker is installed
   - Clone the repository
   - Configure firewall to allow ports 8000 and 5173
   - Run deployment commands

2. **For Production**:
   - Copy and configure .env file with production secrets
   - Consider setting up HTTPS with SSL certificates
   - Set up nginx as reverse proxy
   - Configure systemd services for auto-start

3. **Testing**:
   - Test backend health endpoint
   - Test frontend accessibility
   - Verify login functionality
   - Check CORS in browser console

See `docs/ops/VPS_DEPLOYMENT_172.235.33.181.md` for detailed deployment instructions.
