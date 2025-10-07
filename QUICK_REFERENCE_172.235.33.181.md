# Quick Reference: VPS 172.235.33.181 Configuration

## Access URLs
- Frontend: **http://172.235.33.181:5173**
- Backend API: **http://172.235.33.181:8000**
- Admin Panel: **http://172.235.33.181:8000/admin**
- Health Check: **http://172.235.33.181:8000/api/health/**

## Quick Deploy Commands

### Option 1: Docker (Recommended)
```bash
cd nexpat/infra
docker-compose up -d
```

### Option 2: Docker Production
```bash
cd nexpat/infra
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option 3: Manual
```bash
# Terminal 1 - Backend
cd nexpat/apps/backend
python manage.py runserver 0.0.0.0:8000

# Terminal 2 - Frontend  
cd nexpat/apps/web
npm run dev -- --host 0.0.0.0
```

## Key Configuration Values

| Setting | Value |
|---------|-------|
| VPS IP | 172.235.33.181 |
| Backend Port | 8000 |
| Frontend Port | 5173 |
| DJANGO_ALLOWED_HOSTS | 172.235.33.181 |
| CORS_ALLOWED_ORIGINS | http://172.235.33.181:5173 |
| VITE_API_BASE_URL | http://172.235.33.181:8000 |

## Firewall Setup

### Ubuntu/Debian (ufw)
```bash
sudo ufw allow 8000/tcp
sudo ufw allow 5173/tcp
```

### CentOS/RHEL (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload
```

## Quick Troubleshooting

### CORS Error
```bash
# Check backend CORS config
docker-compose exec backend env | grep CORS
# Should show: http://172.235.33.181:5173
```

### Cannot Connect
```bash
# Check if services are running
docker-compose ps
# or
netstat -tlnp | grep -E "8000|5173"
```

### Frontend Can't Reach Backend
```bash
# Check frontend config
cat apps/web/.env.production
# Should show: VITE_API_BASE_URL=http://172.235.33.181:8000
```

## Files Changed

### Backend
- `apps/backend/.env` - Added VPS IP to CORS
- `apps/backend/clinicq_backend/settings.py` - Fixed default CORS port

### Frontend
- `apps/web/.env` - Added deployment comments
- `apps/web/.env.production` - NEW: VPS production config
- `apps/web/vite.config.js` - Listen on all interfaces

### Docker
- `infra/docker-compose.yml` - Added CORS/CSRF with VPS IP
- `infra/docker-compose.prod.yml` - Fixed defaults for VPS

### Templates
- `ENV.sample` - Added VPS IP
- `infra/deploy/.env.example` - Added VPS IP

### Nginx
- `infra/deploy/clinicq.nginx` - Added VPS IP to server_name

## Verification

```bash
# Test backend
curl http://172.235.33.181:8000/api/health/

# Test CORS
curl -H "Origin: http://172.235.33.181:5173" \
     -X OPTIONS http://172.235.33.181:8000/api/auth/login/ -v

# Check listening ports
sudo netstat -tlnp | grep -E "8000|5173"
```

## Documentation
- Full deployment guide: `docs/ops/VPS_DEPLOYMENT_172.235.33.181.md`
- Configuration summary: `CONFIG_REVIEW_SUMMARY.md`
- Main README: `README.md`
