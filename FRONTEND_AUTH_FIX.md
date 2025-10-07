# Frontend Authentication Fix

## Problem
The backend login works but frontend login was failing due to network configuration issues when deploying to VPS (172.235.33.181).

## Changes Made

### 1. Frontend Configuration (`apps/web/package.json`)
Updated the `dev` script to explicitly expose the Vite development server on all network interfaces:

```json
"dev": "vite --host 0.0.0.0 --port 5173"
```

This allows external access to the development server from the VPS IP address.

### 2. Production Environment Configuration
For VPS deployment, create a `.env.production` file in `apps/web/` with the VPS API endpoint:

```bash
VITE_API_BASE_URL=http://172.235.33.181:8000
```

**Note**: This file is gitignored for security. Create it manually on the server or in your build pipeline.

### 3. Backend Settings (Already Correct)
The backend settings in `apps/backend/clinicq_backend/settings.py` were already properly configured:

- **ALLOWED_HOSTS**: Includes `172.235.33.181`, `localhost`, `127.0.0.1`
- **CORS_ALLOWED_ORIGINS**: Includes `http://172.235.33.181:5173`, `http://localhost:5173`, `http://127.0.0.1:5173`
- **CORS_ALLOW_CREDENTIALS**: Set to `True`
- **CSRF_TRUSTED_ORIGINS**: Includes VPS IP
- **SESSION_COOKIE_SECURE** and **CSRF_COOKIE_SECURE**: Both set to `False` for HTTP (via `SECURE_SSL_REDIRECT` which defaults to false)

### 4. Vite Configuration (Already Correct)
The `apps/web/vite.config.js` was already configured to:
- Listen on all network interfaces (`host: '0.0.0.0'`)
- Use port 5173
- Proxy `/api` requests to Django backend in development

## Testing

### Local Development
```bash
cd apps/web
npm run dev
# Access via http://localhost:5173 or http://127.0.0.1:5173
```

### VPS Deployment
```bash
cd apps/web
npm run build
# or with Docker
docker compose build frontend && docker compose up -d frontend
```

### Verify Backend
```bash
# Test login endpoint
curl -X POST http://172.235.33.181:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"your_password"}'
```

## Summary
The main fix was to explicitly add `--host 0.0.0.0 --port 5173` to the dev script in package.json (even though vite.config.js already had these settings) and create a `.env.production` file for VPS deployment. The backend configuration was already correct and did not require changes.

## Authentication Flow
- **Frontend**: Uses Token authentication with `Authorization: Token <token>` header
- **Backend**: Uses DRF TokenAuthentication
- **Endpoint**: `/api/auth/login/`
- **Credentials**: `{ username, password }`
