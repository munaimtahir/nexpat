# Applications

This directory contains all deployable applications in the ClinicQ monorepo.

## Applications

### Backend (`backend/`)
Django REST API providing authentication, patient management, queue operations, and file uploads.

**Quick Start:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

See [backend/README.md](backend/README.md) for detailed setup instructions.

### Web (`web/`)
React + Vite single-page application for desktop/web access.

**Quick Start:**
```bash
cd web
npm install
npm run dev
```

See [web/README.md](web/README.md) for detailed setup instructions.

### Mobile (`mobile/`)
React Native + Expo application for iOS and Android.

**Quick Start:**
```bash
cd mobile
npm install
npx expo start
```

See [mobile/README.md](mobile/README.md) for detailed setup instructions.

## Development

All applications can be run together using Docker Compose from the repository root:

```bash
cd ../infra
docker-compose up
```

This will start:
- PostgreSQL database
- Django backend API (port 8000)
- React frontend (port 5173)
