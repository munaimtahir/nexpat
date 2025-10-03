# Project Directory Structure

This document describes the organization and structure of the ClinicQ project, a full-stack healthcare queue management system.

## Overview

ClinicQ is a monorepo containing three main applications:
- **Backend API** (Django REST Framework)
- **Web Frontend** (React + Vite)
- **Mobile App** (React Native + Expo)

## Repository Root

```
nexpat/
├── clinicq_backend/        # Django REST API backend
├── clinicq_frontend/       # React web application
├── clinicq_Mobile/         # React Native mobile app
├── deploy/                 # Deployment scripts and configurations
├── docs/                   # Shared documentation
├── secrets/                # Credentials and service account files (gitignored)
├── .github/                # GitHub Actions workflows and configurations
├── docker-compose.yml      # Local development environment
├── docker-compose.prod.yml # Production Docker setup
└── [configuration files]   # Root-level configs (pytest, mypy, flake8, etc.)
```

## Backend: `clinicq_backend/`

Django-based REST API handling authentication, patient management, queue operations, and file uploads.

```
clinicq_backend/
├── api/                           # Main API application
│   ├── models.py                  # Database models (Patient, Visit, Queue, etc.)
│   ├── serializers.py             # DRF serializers for API responses
│   ├── views.py                   # API viewsets and endpoints
│   ├── urls.py                    # API URL routing
│   ├── permissions.py             # Custom permission classes
│   ├── admin.py                   # Django admin configuration
│   ├── pagination.py              # Custom pagination classes
│   ├── google_drive.py            # Google Drive integration for uploads
│   ├── management/                # Django management commands
│   │   └── commands/
│   │       └── export_audit_log.py
│   ├── migrations/                # Database migrations
│   └── test_*.py                  # Unit and integration tests
│
├── clinicq_backend/               # Django project settings
│   ├── settings.py                # Main settings (uses environment variables)
│   ├── urls.py                    # Root URL configuration
│   ├── wsgi.py                    # WSGI application
│   └── asgi.py                    # ASGI application
│
├── server/                        # Static assets for API docs/admin
│   └── static/
│       ├── css/
│       └── js/
│
├── tests/                         # Additional test files
├── manage.py                      # Django management script
├── requirements.txt               # Production dependencies
├── requirements-dev.txt           # Development dependencies
├── .env                           # Environment variables (not in git)
├── Dockerfile                     # Container definition
└── entrypoint.sh                  # Docker entrypoint script
```

### Key Backend Components

- **Models**: `Patient`, `Visit`, `Queue`, `PrescriptionImage`
- **Authentication**: Token-based auth with Django REST Framework
- **Permissions**: Role-based access control (Doctor, Assistant, Admin)
- **API Endpoints**: RESTful endpoints under `/api/`

## Frontend: `clinicq_frontend/`

React-based single-page application for desktop/web access.

```
clinicq_frontend/
├── src/
│   ├── App.jsx                    # Root component with routing
│   ├── main.jsx                   # Application entry point
│   ├── AuthContext.jsx            # Authentication state management
│   ├── ErrorBoundary.jsx          # Error handling wrapper
│   ├── api.js                     # Axios client configuration
│   │
│   ├── pages/                     # Route components
│   │   ├── LoginPage.jsx          # Login form
│   │   ├── AssistantPage.jsx     # Assistant dashboard (patient intake)
│   │   ├── DoctorPage.jsx        # Doctor dashboard (queue management)
│   │   ├── PublicDisplayPage.jsx # Public queue display
│   │   ├── PatientsPage.jsx      # Patient list and search
│   │   ├── PatientFormPage.jsx   # Patient create/edit form
│   │   └── UnauthorizedPage.jsx  # 403 error page
│   │
│   ├── components/                # Reusable components
│   │   ├── ProtectedRoute.jsx    # Route guard component
│   │   ├── StatusBadge.jsx       # Visit status badge
│   │   ├── TimeStamp.jsx         # Formatted timestamp display
│   │   └── index.js              # Component exports
│   │
│   ├── utils/                     # Utility functions
│   │   └── api.js                # API helper functions
│   │
│   ├── __tests__/                 # Test files
│   │   ├── AssistantPage.test.jsx
│   │   ├── DoctorPage.test.jsx
│   │   └── PublicDisplayPage.test.jsx
│   │
│   ├── __mocks__/                 # Test mocks
│   │   └── api.js
│   │
│   └── assets/                    # Static assets (images, icons)
│
├── public/                        # Static files served as-is
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite build configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── eslint.config.js               # ESLint rules
├── jest.config.cjs                # Jest test configuration
├── .env                           # Environment variables (not in git)
├── Dockerfile                     # Multi-stage build for production
├── nginx.conf                     # Nginx configuration for SPA
└── README.md                      # Frontend-specific documentation
```

### Key Frontend Features

- **Role-based routing**: Different dashboards for Assistants, Doctors
- **Authentication**: Token-based with automatic logout on 401
- **Real-time updates**: Auto-refresh for queue displays
- **Patient management**: CRUD operations with search
- **Prescription uploads**: Doctor-only feature via Google Drive

## Mobile: `clinicq_Mobile/`

React Native application built with Expo for iOS and Android.

```
clinicq_Mobile/
├── src/
│   ├── api/                       # API integration layer
│   │   ├── client.ts              # Axios client with interceptors
│   │   ├── generated/             # OpenAPI generated code
│   │   ├── hooks/                 # React Query hooks
│   │   │   ├── useDiagnostics.ts
│   │   │   ├── usePatients.ts
│   │   │   ├── useUploads.ts
│   │   │   └── useVisits.ts
│   │   └── outbox/                # Offline write queue
│   │       ├── outbox.ts
│   │       ├── replay.ts
│   │       ├── types.ts
│   │       └── useOutboxProcessor.ts
│   │
│   ├── screens/                   # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── DoctorQueueScreen.tsx
│   │   ├── VisitsQueueScreen.tsx
│   │   ├── PatientsListScreen.tsx
│   │   ├── PatientDetailScreen.tsx
│   │   ├── PatientFormScreen.tsx
│   │   ├── VisitDetailScreen.tsx
│   │   ├── UploadManagerScreen.tsx
│   │   ├── DiagnosticsScreen.tsx
│   │   └── PublicDisplayScreen.tsx
│   │
│   ├── navigation/                # Navigation configuration
│   │   ├── index.tsx              # Navigator setup
│   │   └── types.ts               # Navigation type definitions
│   │
│   ├── components/                # Reusable UI components
│   │   ├── Card.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingIndicator.tsx
│   │   ├── SearchBar.tsx
│   │   └── VisitStatusTag.tsx
│   │
│   ├── features/                  # Feature modules
│   │   └── auth/                  # Authentication feature
│   │
│   ├── providers/                 # App-level providers
│   │   ├── AppProviders.tsx       # Combines all providers
│   │   └── sentry.ts              # Error tracking setup
│   │
│   ├── storage/                   # Local storage utilities
│   │   └── secureStore.ts         # Secure credential storage
│   │
│   ├── theme/                     # Theming and styles
│   │   ├── colors.ts
│   │   └── index.ts
│   │
│   ├── i18n/                      # Internationalization
│   │   └── index.ts
│   │
│   ├── constants/                 # App constants
│   │   ├── index.ts
│   │   └── queryKeys.ts           # React Query cache keys
│   │
│   └── utils/                     # Utility functions
│       ├── environment.ts         # Environment variable handling
│       └── logger.ts              # Logging utilities
│
├── docs/                          # Mobile-specific documentation
│   ├── STATUS.md                  # Development status
│   ├── ARCHITECTURE.md            # Technical architecture
│   ├── API.md                     # API integration docs
│   ├── ROADMAP.md                 # Feature roadmap
│   ├── SETUP.md                   # Setup instructions
│   ├── TESTS.md                   # Testing guide
│   └── [other docs]
│
├── App.tsx                        # Root component
├── index.js                       # Entry point
├── app.config.ts                  # Expo configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
├── jest.config.js                 # Jest configuration
├── babel.config.js                # Babel configuration
└── README.md                      # Mobile-specific README
```

### Key Mobile Features

- **Offline-first architecture**: Local storage with sync queue
- **Role-based navigation**: Tab-based navigation per role
- **Image uploads**: Camera and gallery integration
- **Real-time updates**: React Query with optimistic updates
- **Internationalization**: Multi-language support ready
- **Error tracking**: Sentry integration

## Deployment: `deploy/`

Production deployment scripts and configurations.

```
deploy/
├── deploy_backend.sh              # Backend deployment script
├── build_frontend.sh              # Frontend build script
├── clinicq.service                # systemd service file
└── clinicq.nginx                  # Nginx reverse proxy config
```

## Documentation: `docs/`

Shared documentation not specific to any single application.

```
docs/
├── api.md                         # API documentation
├── deployment.md                  # Deployment guide
└── stack_assessment.md            # Technology stack overview
```

## Configuration Files (Root Level)

```
├── .flake8                        # Python linting configuration
├── mypy.ini                       # Python type checking configuration
├── pytest.ini                     # Python test configuration
├── .gitignore                     # Git ignore patterns
├── docker-compose.yml             # Local development setup
├── docker-compose.prod.yml        # Production Docker setup
├── ENV.sample                     # Example environment variables
└── .github/                       # GitHub Actions CI/CD workflows
```

## Documentation Files (Root Level)

```
├── README.md                      # Main project README
├── STRUCTURE.md                   # This file
├── CHANGELOG.md                   # Version history
├── CONTRIBUTING.md                # Contribution guidelines
├── SECURITY.md                    # Security policies
├── DEPLOYMENT_GUIDE.md            # Detailed deployment instructions
├── PROJECT_BRIEF.md               # Project overview
├── development_plan.md            # Development stages
├── task_graph.md                  # Task dependencies
└── [other docs]                   # Various planning and review docs
```

## Environment Variables

Each application uses environment variables for configuration:

### Backend (`clinicq_backend/.env`)
- `DJANGO_DEBUG`: Debug mode (true/false)
- `DJANGO_SECRET_KEY`: Django secret key
- `DATABASE_URL`: PostgreSQL connection string
- `DJANGO_ALLOWED_HOSTS`: Comma-separated allowed hosts
- `CORS_ALLOWED_ORIGINS`: Comma-separated CORS origins
- `GOOGLE_DRIVE_CREDENTIALS_FILE`: Path to service account JSON

### Frontend (`clinicq_frontend/.env`)
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_SENTRY_DSN`: Sentry error tracking DSN (optional)

### Mobile (`clinicq_Mobile/.env`)
- `SERVER_URL`: Backend API URL
- `SENTRY_DSN`: Sentry error tracking DSN (optional)

## Development Workflow

1. **Local Development**: Use `docker-compose.yml` for full-stack local setup
2. **Backend Development**: `cd clinicq_backend && python manage.py runserver`
3. **Frontend Development**: `cd clinicq_frontend && npm run dev`
4. **Mobile Development**: `cd clinicq_Mobile && npx expo start`
5. **Testing**: Each app has its own test suite (pytest, Jest, Jest+Testing Library)
6. **CI/CD**: GitHub Actions workflows in `.github/workflows/`

## Testing Structure

- **Backend**: Pytest tests in `clinicq_backend/api/test_*.py` and `clinicq_backend/tests/`
- **Frontend**: Jest tests in `clinicq_frontend/src/__tests__/` and `*.test.jsx` files
- **Mobile**: Jest tests colocated with components (TBD based on needs)

## Build Artifacts (Gitignored)

- `clinicq_backend/__pycache__/`, `*.pyc`: Python bytecode
- `clinicq_backend/.pytest_cache/`: Pytest cache
- `clinicq_backend/db.sqlite3`: Local SQLite database
- `clinicq_frontend/node_modules/`: npm packages
- `clinicq_frontend/dist/`: Production build output
- `clinicq_Mobile/node_modules/`: npm packages
- `clinicq_Mobile/.expo/`: Expo cache
- `secrets/`: Service account credentials

## Key Design Decisions

1. **Monorepo Structure**: All applications in one repository for easier coordination
2. **Shared Backend**: Single Django API serves both web and mobile clients
3. **Token Authentication**: Simple, stateless authentication for API access
4. **Role-Based Access**: Three roles (Admin, Doctor, Assistant) with different permissions
5. **Docker Support**: Both development and production containerization
6. **Environment-Based Config**: All sensitive data in environment variables
7. **Offline-First Mobile**: Mobile app works offline with sync queue

## Additional Resources

- [Main README](README.md) - Quick start guide
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Changelog](CHANGELOG.md) - Version history
- [Frontend README](clinicq_frontend/README.md) - Frontend details
- [Mobile README](clinicq_Mobile/README.md) - Mobile app details
- [Mobile Status](clinicq_Mobile/docs/STATUS.md) - Mobile development status
