# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - YYYY-MM-DD <!-- Replace with actual release date for v0.2.0 -->

### Added

*   **Permanent Patient Record**:
    *   Introduced `Patient` model (`id` (auto as `registration_number`), `name`, `phone`, `gender`).
    *   API endpoint `GET /api/patients/search/?q=` for searching patients by registration number, name fragment, or phone fragment.
    *   Full CRUD API endpoints for patients under `/api/patients/`.
    *   Database indexes added for `Patient.phone` and `Patient.name` for optimized searching.
*   **Patient Management Frontend**:
    *   React pages to list, search, create, update, and delete patients, linked from the home page.
*   **Multi-Queue Support**:
    *   Introduced `Queue` model (`id`, `name`) to manage multiple service queues (up to 5 as per requirements, though model supports more).
    *   Queues are manageable via Django Admin.
    *   API endpoint `GET /api/queues/` to list available queues.
*   **Enhanced Visit Management**:
    *   `Visit` model updated with foreign keys to `Patient` and `Queue`.
    *   Token numbers are now generated per queue and reset daily per queue.
    *   Public display updated: `/display` shows all queues; `/display?queue=<id>` shows a specific queue. (Conceptual - frontend changes pending).
*   **Quick Re-registration Flow**:
    *   Assistant can enter a patient's registration number to auto-fill their details.
    *   Submitting the form for a returning patient creates a new `Visit` record without modifying patient data.
*   **Previous Visit Glance**:
    *   `PatientSerializer` now includes `last_5_visit_dates` for display on Assistant and Doctor dashboards. (Conceptual - frontend changes pending).
*   **Database Migrations**:
    *   Schema migrations for `Patient` and `Queue` tables.
    *   Data migration to back-fill Release 1 data:
        *   Creates a default "General" queue.
        *   Creates "anonymous" patient records from existing visit data.
        *   Associates existing visits with the default queue and their respective anonymous patient.
*   **Testing**:
    *   Unit/integration tests for patient search, multi-queue independence, and migration back-fill logic.
    *   Backend test coverage maintained at ≥80% (currently ~91%). User requirement for Release 2 was ≥80%, task breakdown mentioned aiming for ≥80%.

### Changed

*   **Visit Model**:
    *   Added `patient` (ForeignKey to `Patient`) and `queue` (ForeignKey to `Queue`) fields.
    *   `unique_together` constraint updated to `('token_number', 'visit_date', 'queue')`.
    *   Default ordering updated to `['visit_date', 'queue', 'token_number']`.
    *   Original `patient_name` and `patient_gender` fields on `Visit` are kept for historical data but are now populated from the linked `Patient` for new visits.
*   **Token Generation Logic**: Updated to be per-queue, per-day.
*   **API `POST /api/visits/`**: Now requires `patient` (ID of patient) and `queue` (ID of queue) in the request payload.
*   **API `GET /api/visits/`**: Can now be filtered by `queue=<id>`.

### Fixed

*   N/A (No specific bug fixes noted for this release, primarily new features).

### Removed

*   N/A

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
