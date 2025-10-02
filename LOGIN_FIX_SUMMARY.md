# Login Integration Fix - Quick Reference

## Problem Summary
Login integration between React frontend (localhost:5173) and Django backend (127.0.0.1:8000) was failing in local development due to missing environment configuration and CORS issues.

## Solution Overview
- Added `.env` files for both backend and frontend with proper configuration
- Enabled CORS with credentials support
- Integrated python-dotenv for automatic environment variable loading
- Added health endpoint for connectivity testing
- Updated documentation with comprehensive local dev guide

## Files Changed

### Backend
- `clinicq_backend/.env` - Development environment configuration (new)
- `clinicq_backend/requirements.txt` - Added python-dotenv
- `clinicq_backend/clinicq_backend/settings.py` - Auto-load .env files, added CORS_ALLOW_CREDENTIALS
- `clinicq_backend/api/views.py` - Added health endpoint
- `clinicq_backend/api/urls.py` - Registered health endpoint
- `clinicq_backend/api/test_api.py` - Added health endpoint test

### Frontend
- `clinicq_frontend/.env` - Development environment configuration (new)
- `clinicq_frontend/.env.development` - Dev-specific config (new)
- `clinicq_frontend/vite.config.js` - Added proxy configuration for /api routes

### Documentation
- `README.md` - Added comprehensive "Local Development Quick Start" section

### Other
- `.gitignore` - Updated to allow dev env files while blocking sensitive ones

## Quick Start

### Backend
```bash
cd clinicq_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # Optional
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd clinicq_frontend
npm install
npm run dev
```

### Test Login
1. Open http://localhost:5173
2. Click "Login"
3. Use credentials:
   - Admin: `admin` / `admin123`
   - Doctor: `doctor` / `doctor123`
   - Assistant: `assistant` / `assistant123`

## Verification Commands

### Test Health Endpoint
```bash
curl http://127.0.0.1:8000/api/health/
# Expected: {"status":"ok","service":"clinicq-backend","timestamp":"..."}
```

### Test Login Endpoint
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Expected: {"token":"..."}
```

### Run Backend Tests
```bash
cd clinicq_backend
source .venv/bin/activate
pytest api/test_api.py::HealthEndpointTests -v
```

## Key Configuration

### Backend .env
```env
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,testserver
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend .env
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Vite Proxy (eliminates CORS in dev)
```javascript
// vite.config.js
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
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure both `localhost` and `127.0.0.1` are in `CORS_ALLOWED_ORIGINS` |
| 404 to `/api/auth/login/` | Check `VITE_API_BASE_URL` is set in frontend `.env` |
| 401 Unauthorized | Verify username/password, run migrations |
| Connection refused | Ensure backend is running on port 8000 |
| DisallowedHost error | Add `127.0.0.1` to `DJANGO_ALLOWED_HOSTS` |

## Test Results
✅ Health endpoint: Returns 200 OK  
✅ Login endpoint: Returns valid token  
✅ Frontend login: Redirects to dashboard  
✅ Protected routes: Accessible after login  
✅ Automated tests: Pass  

## Notes
- Browsers treat `localhost` and `127.0.0.1` as different origins
- `.env` files are now committed for development (no secrets)
- Production should use `.env.production` with proper secret management
- Vite proxy eliminates CORS during development
