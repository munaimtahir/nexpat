# OPD Queue Manager

This is a Django + React application for managing outpatient department (OPD) queues.

## Current Status
This project is being developed in **stages** using AI coding agents (Jules + GitHub Copilot).

## Workflow
- **Stage 1**: Core fixes and polishing
- **Stage 2**: Missing features build-out
- **Stage 3**: Deep testing and debugging

See `docs/decisions/development_plan.md` and `docs/decisions/task_graph.md` for details.

## Repository Structure Improvements

- Review the proposed re-organization plan in [`docs/references/REPO_STRUCTURE_IMPROVEMENTS.md`](docs/references/REPO_STRUCTURE_IMPROVEMENTS.md) for guidance on consolidating apps, documentation, and infrastructure assets into a cleaner monorepo layout.


## Local Quickstart

The fastest way to get the NEXPAT backend running is with Docker Compose:

```bash
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up backend db
```

This will:
- Start PostgreSQL database
- Run Django migrations automatically
- Create a superuser (admin / admin123)
- Start the Django backend on port 8000

Once the backend is running, open your browser to:
- **Backend Admin**: [http://localhost:8000/admin](http://localhost:8000/admin) (login: `admin` / `admin123`)
- **Backend Health**: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)

### Running the Frontend

**Note**: There is currently a known npm installation issue in Docker (see `apps/web/DOCKER_ISSUE.md`). The recommended approach is to run the frontend locally:

```bash
# In a separate terminal
cd apps/web
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

### Alternative: Running from infra directory

You can also run from the `infra/` directory (paths are optimized for this):

```bash
cd infra
docker compose up backend db  # Start backend only
```

### Manual Setup

If you prefer to run services individually without Docker:

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd apps/backend
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
   cd apps/web
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

   The frontend will be available at `http://localhost:3000`

### Testing the Login

1. Ensure both backend and frontend servers are running
2. Open your browser and navigate to `http://localhost:3000`
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

The API responds with `{ "token": "..." }`. Include that value in subsequent requests using `Authorization: Token <token>`.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| **CORS errors** | Ensure both `localhost` and `127.0.0.1` are in `CORS_ALLOWED_ORIGINS` in backend `.env` with port 3000 |
| **404 to `/api/auth/login/`** | Check that `VITE_API_BASE_URL` is set correctly in frontend `.env` |
| **401 Unauthorized** | Verify username/password are correct. Run migrations if database is fresh. |
| **Connection refused** | Ensure backend is running on port 8000 and frontend on 3000 |
| **"DisallowedHost" error** | Add `127.0.0.1` to `DJANGO_ALLOWED_HOSTS` in backend `.env` |

**Note**: Browsers treat `localhost` and `127.0.0.1` as different origins. Both must be configured in CORS settings during development.

## 🔐 Authentication Flow

The backend exposes Django REST Framework's token authentication via
`POST /api/auth/login/`. The frontend keeps the returned access token in memory
only; it is **not** persisted to local storage. There is no refresh token
endpoint—when the server responds with `401 Unauthorized`, the frontend clears
any cached token state and redirects users back to the login screen so they can
authenticate again.

## Production Deployment

This application is production-ready with the following features:

- **CORS support** for cross-origin requests between frontend and backend
- **Token-based authentication** with proper `Authorization: Token <token>` headers
- **SPA routing support** with nginx fallback configuration
- **Google Drive integration** for prescription uploads via service account
- **Docker containerization** for both development and production
- **Environment-based configuration** with comprehensive `.env` variables
- **Security hardening** with configurable HTTPS, HSTS, and security headers

### Production Setup Steps

1. **Copy and configure environment files**:
   ```bash
   # Backend
   cp apps/backend/.env.example apps/backend/.env
   # Frontend
   cp apps/web/.env.example apps/web/.env
   ```

2. **Update environment variables**:
   - Set `DEBUG=False` in backend `.env`
   - Update `SECRET_KEY` with a strong random value
   - Configure production database credentials
   - Update `ALLOWED_HOSTS` with your domain
   - Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to your frontend URL
   - Configure `VITE_API_BASE_URL` in frontend `.env` to your backend URL

3. **Deploy with Docker Compose**:
   ```bash
   docker compose -f infra/docker-compose.prod.yml up -d
   ```

See `docs/ops/DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Documentation Hub
Project-wide docs live in **`/docs`** at the repo root:

- `docs/status/DEVELOPMENT_STATUS.md` — current phase & next steps
- `docs/AGENT.md` — AI developer brief
- `docs/Goals.md` — MVP → Beta → Production roadmap
- `docs/CI-CD.md` — GitHub Actions + EAS Build
- `docs/QA-Checklist.md` — Release QA
- `docs/TASKS.md` — Backlog summary

> App-specific docs remain under `apps/*/README.md`.
