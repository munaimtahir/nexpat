# ClinicQ Frontend

A React + Vite single-page application for managing outpatient queues, patient intake, and doctor workflows at the ClinicQ facility. The UI ships with role-aware routing, authenticated dashboards for assistants and doctors, a large-screen public display, and patient administration tooling.

## Key features

- **Role-based navigation** – Centralized auth context fetches the active session, caches roles, and guards assistant, doctor, display, and patient management routes.
- **Assistant portal** – Offers queue selection, debounced patient lookup, visit creation, and clear feedback messaging for generated tokens.
- **Doctor dashboard** – Surfaces visits by queue, allows status transitions, and links directly to patient context and prescription management.
- **Public queue display** – Provides a kiosk-friendly auto-refreshing view of waiting and in-consultation tokens with configurable queue filters.
- **Patient management** – Includes a searchable patient table, create/edit form with validation, and visit history context.
- **Resilient API client** – Axios wrapper normalizes base URLs, injects auth headers, and gracefully redirects to login on 401s.
- **Production-ready telemetry hook** – Optional Sentry DSN bootstraps runtime error collection without code changes.

## Technology stack

- **Framework:** React 19 with React Router 7
- **Build tooling:** Vite 7, Babel, Jest, and Testing Library
- **Styling:** Tailwind CSS utilities supplemented by a small amount of global CSS
- **Quality:** ESLint with React and hooks plugins, Jest + Testing Library for unit and integration coverage

## Project structure

```
clinicq_frontend/
├── index.html           # Base HTML template and metadata
├── src/
│   ├── App.jsx          # Route definitions and landing page
│   ├── AuthContext.jsx  # Session/role state provider
│   ├── api.js           # Axios instance and token helpers
│   ├── pages/           # Feature screens (assistant, doctor, display, patients, auth)
│   ├── components/      # Shared UI elements (protected routes, tables, forms)
│   ├── utils/           # API helpers and shared utilities
│   └── assets/          # Static assets loaded by the bundle
├── public/              # Static assets served as-is (favicon, etc.)
└── package.json         # Scripts, dependencies, and tooling configuration
```

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- A running ClinicQ backend API (see `docker-compose.yml` or backend documentation)

### Installation

```bash
cd clinicq_frontend
npm install
```

### Environment configuration

Create a `.env` file (or copy `ENV.sample`) alongside `package.json` and configure the following variables as needed:

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL of the ClinicQ backend. A trailing `/api` segment is appended automatically when missing. | `/api` |
| `VITE_SENTRY_DSN` | Optional Sentry DSN for client-side error reporting. | _unset_ |

### Development server

```bash
npm run dev
```

The application is served with hot module reloading at [http://localhost:5173](http://localhost:5173). API requests are proxied to the URL defined by `VITE_API_BASE_URL`.

### Linting and tests

```bash
npm run lint   # Static analysis
npm run test   # Jest + Testing Library suite
```

Both commands are executed in CI; run them locally before opening a pull request.

### Production build

```bash
npm run build
```

Vite outputs the static build to `dist/`. Preview the production bundle locally with `npm run preview`.

## Styling guidelines

- Tailwind utility classes handle component-level layout and theming.
- Global styles in `src/index.css` set consistent typography, colors, and link states for the entire SPA.
- Additional component-specific styles should prefer Tailwind utilities; use CSS modules or scoped styles only when necessary.

## Deployment notes

- The frontend expects the backend to expose `/auth/me/`, `/auth/login/`, `/auth/logout/`, `/visits/`, `/queues/`, and `/patients/` endpoints.
- Set `VITE_API_BASE_URL` to the externally reachable backend URL before building for production.
- Provide a valid `VITE_SENTRY_DSN` in production environments to capture runtime errors.
