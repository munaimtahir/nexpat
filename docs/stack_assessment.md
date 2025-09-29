# Stack Assessment — February 2025

This report documents the current state of the ClinicQ application after verifying installation paths, database migrations, documentation coverage, and deploy readiness.

## Backend (Django)

- **Environment setup**: Installing the production and development requirements into a clean virtual environment succeeds without conflicts (`pip install -r requirements.txt` followed by `pip install -r requirements-dev.txt`).
- **System checks**: `python manage.py check` reports no issues once dependencies are installed.
- **Migrations**: `python manage.py migrate --check` and `python manage.py makemigrations --check` now complete successfully, confirming schema parity with the migration files.
- **Server readiness**: With migrations validated the backend can start normally using `python manage.py runserver` (see mitigation notes below for fixes that were required).

## Frontend (React + Vite)

- **Build tooling**: `npm run build` completes in ~5 seconds and produces assets under `dist/`.
- **Runtime expectations**: The SPA expects API routes under `/api`, matching the backend routing tree.
- **Warning**: npm reports `Unknown env config "http-proxy"` from the environment; while harmless, document the warning if observed in CI or local environments.

## Documentation Quality

- Root-level guides (`README.md`, `DEPLOYMENT_GUIDE.md`, `docs/deployment.md`) cover architecture, environment variables, Docker usage, and deployment workflows.
- Frontend-specific onboarding lives in `clinicq_frontend/README.md` and matches the current directory layout.
- Backend setup instructions are split across `DEPLOYMENT_GUIDE.md` and `docs/deployment.md`; consider consolidating a lightweight `clinicq_backend/README.md` for quick starts.

## Discrepancies and Mitigations

| Area | Issue | Impact | Resolution / Plan |
| --- | --- | --- | --- |
| Backend models | A stray scaffold marker inside `Visit.__str__` caused `IndentationError`, blocking any Django management command. | Prevented installs, checks, and server startup. | Removed the marker and restored a descriptive `__str__` implementation. |
| Data migrations | Migration `0003_backfill_visits_to_patients_queues` contained an orphan `=` line, raising a `SyntaxError` during `migrate`. | Broke every migration command, rendering deploys impossible. | Deleted the rogue token; confirmed migrations now parse correctly. |
| npm warning | `npm run build` emits `Unknown env config "http-proxy"`. | Build continues but warning could confuse developers. | Trace the config source (likely a global `.npmrc`) and document in onboarding materials if it persists. |
| Backend quickstart docs | No backend-specific README detailing local setup without Docker. | Slows onboarding for developers running directly on host. | Draft a short backend README that references `requirements.txt`, environment variables, and manage.py workflows. |

## Next Steps

1. Open a small documentation task to add a backend quickstart README (or extend `DEPLOYMENT_GUIDE.md` with a "local development" excerpt).
2. Investigate the npm `http-proxy` warning source and add guidance if reproducible.
3. Run the Django and React automated test suites in CI to keep regressions from landing.

