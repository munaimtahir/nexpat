# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - YYYY-MM-DD <!-- Replace with actual release date -->

### Added

*   **Initial Scaffolding**: Django 5 backend with DRF, React 18 (Vite + Tailwind CSS) frontend.
*   **Core Token Queue Features**:
    *   Assistant portal (`/assistant`) for generating daily patient tokens (name, gender inputs).
    *   Public queue display (`/display`) showing waiting tokens, auto-refreshing every 5s, highlighting the first token.
    *   Doctor dashboard (`/doctor`) listing waiting tokens with a "Mark Done" functionality.
*   **Persistence**: `Visit` model (`id`, `token_number`, `patient_name`, `patient_gender`, `visit_date`, `status [WAITING|DONE]`, `created_at`, `updated_at`).
    *   Unique constraint on `(token_number, visit_date)`.
    *   Tokens reset daily starting from 1.
*   **API Endpoints**:
    *   `POST /api/visits/`: Create new visit and generate token.
    *   `GET /api/visits/?status=WAITING`: List today's waiting visits, ordered by token number.
    *   `PATCH /api/visits/<id>/done/`: Mark a visit's status as 'DONE'.
*   **Admin Bootstrap**: Django admin enabled for `Visit` model.
*   **Testing**:
    *   Backend: Pytest tests for models and API endpoints (currently 94% coverage).
    *   Frontend: Jest/RTL/MSW/jest-axe setup with smoke and happy-path tests drafted for pages (execution blocked by sandbox environment issues).
*   **CI/CD**: GitHub Actions workflow for linting (Flake8, Black, ESLint), backend tests, frontend tests (best effort), and frontend build with artifact archiving.
*   **Ops Files (`deploy/`)**:
    *   `.env.example`: Template for environment variables.
    *   `deploy_backend.sh`: Example backend deployment script.
    *   `build_frontend.sh`: Example frontend build script.
    *   `clinicq.service`: Example systemd service file for Gunicorn.
    *   `clinicq.nginx`: Example Nginx configuration.
*   **Local Development Environment**:
    *   `Dockerfile` for backend (Python/Django).
    *   `Dockerfile` for frontend (React/Nginx multi-stage).
    *   `docker-compose.yml` for one-command local setup (PostgreSQL, Django dev server, Vite dev server).
    *   `entrypoint.sh` for backend Docker image to handle migrations and auto-create superuser if `DJANGO_SUPERUSER_*` env vars are set.
*   **Documentation**:
    *   `README.md` with project overview, stack, and Docker-based local setup instructions.
    *   `CHANGELOG.md` (this file).

### Changed

*   N/A (Initial Release)

### Fixed

*   N/A (Initial Release)

### Removed

*   N/A (Initial Release)
```
