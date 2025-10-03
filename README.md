# ClinicQ - OPD Queue Manager

A comprehensive healthcare queue management system built with Django, React, and React Native.

## 📋 Project Overview

ClinicQ is a full-stack monorepo application for managing outpatient department (OPD) queues, featuring:
- **Backend API**: Django REST Framework with token authentication
- **Web Frontend**: React + Vite single-page application
- **Mobile App**: React Native + Expo for iOS and Android

## 🏗️ Project Structure

This is a monorepo containing three main applications:

```
nexpat/
├── clinicq_backend/     # Django REST API
├── clinicq_frontend/    # React web app
├── clinicq_Mobile/      # React Native mobile app
├── deploy/              # Deployment scripts
├── docs/                # Shared documentation
└── [configs]            # Root-level configuration files
```

**📖 For detailed directory structure and organization, see [STRUCTURE.md](STRUCTURE.md)**

## 🚀 Current Status

This project is being developed in **stages** using AI coding agents (Jules + GitHub Copilot).

### Development Workflow
- **Stage 1**: Core fixes and polishing ✅
- **Stage 2**: Missing features build-out 🔄
- **Stage 3**: Deep testing and debugging 📋

See `development_plan.md` and `task_graph.md` for details.

## 📚 Documentation

- **[STRUCTURE.md](STRUCTURE.md)** - Detailed directory structure and organization
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[SECURITY.md](SECURITY.md)** - Security policies and reporting

### Component-Specific Documentation
- **[Backend README](clinicq_backend/README.md)** - Django API details (if exists)
- **[Frontend README](clinicq_frontend/README.md)** - React app details and features
- **[Mobile README](clinicq_Mobile/README.md)** - React Native app details
- **[Mobile Status](clinicq_Mobile/docs/STATUS.md)** - Mobile development status

## 🏗️ Local Development Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- pip and npm

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd clinicq_backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Environment variables are already configured in `.env` for local development. The file includes:
   - `DJANGO_DEBUG=true`
   - `DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost`
   - `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create a superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```

7. Start the development server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

   The backend will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd clinicq_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables are already configured in `.env` for local development:
   - `VITE_API_BASE_URL=http://127.0.0.1:8000`

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Testing the Login

1. Ensure both backend and frontend servers are running
2. Open your browser and navigate to `http://localhost:5173`
3. Click "Login" and use one of the test credentials:
   - **Admin**: username `admin`, password `admin123`
   - **Doctor**: username `doctor`, password `doctor123`
   - **Assistant**: username `assistant`, password `assistant123`

4. You should be redirected to the appropriate dashboard based on your role

### Verify Backend Health

Test the health endpoint:
```bash
curl http://127.0.0.1:8000/api/health/
```

Test the login endpoint:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| **CORS errors** | Ensure both `localhost` and `127.0.0.1` are in `CORS_ALLOWED_ORIGINS` in backend `.env` |
| **404 to `/api/auth/login/`** | Check that `VITE_API_BASE_URL` is set correctly in frontend `.env` |
| **401 Unauthorized** | Verify username/password are correct. Run migrations if database is fresh. |
| **Connection refused** | Ensure backend is running on port 8000 and frontend on 5173 |
| **"DisallowedHost" error** | Add `127.0.0.1` to `DJANGO_ALLOWED_HOSTS` in backend `.env` |

**Note**: Browsers treat `localhost` and `127.0.0.1` as different origins. Both must be configured in CORS settings during development.

## 🔐 Authentication Flow

The backend exposes Django REST Framework's token authentication via
`POST /api/auth/login/`. The frontend keeps the returned access token in memory
only; it is **not** persisted to local storage. There is no refresh token
endpoint—when the server responds with `401 Unauthorized`, the frontend clears
any cached token state and redirects users back to the login screen so they can
authenticate again.

## ⚙️ Technology Stack

### Backend
- **Framework**: Django 5.1 + Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: Token-based auth
- **File Storage**: Google Drive API integration
- **Deployment**: Gunicorn + Nginx

### Frontend (Web)
- **Framework**: React 19 with React Router 7
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS
- **Testing**: Jest + Testing Library
- **Deployment**: Docker + Nginx

### Mobile
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State Management**: React Query
- **Navigation**: React Navigation
- **Offline Support**: Outbox pattern with local storage

## 🚀 Deployment

This application is production-ready with the following features:

- **CORS support** for cross-origin requests between frontend and backend
- **Token-based authentication** with proper `Authorization: Token <token>` headers
- **SPA routing support** with nginx fallback configuration
- **Google Drive integration** for prescription uploads via service account
- **Docker containerization** for both development and production
- **Environment-based configuration** with comprehensive `.env` variables
- **Security hardening** with configurable HTTPS, HSTS, and security headers

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

See [LICENSE.md](LICENSE.md) for details.

## 🔗 Quick Links

- [Directory Structure Documentation](STRUCTURE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Development Plan](development_plan.md)
- [Task Graph](task_graph.md)
- [API Checklist](API_CHECKLIST.md)
- [Test Plan](TEST_PLAN.md)
