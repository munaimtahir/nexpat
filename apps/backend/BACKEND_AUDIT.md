# Backend Audit Summary

## Architecture Overview
- **Framework & project layout** – The backend is a Django 5.2 project (`clinicq_backend`) with a single first-party app named `api`, complemented by REST framework, token auth, and CORS middleware in the installed apps list.【F:apps/backend/clinicq_backend/settings.py†L37-L78】
- **Entrypoints** – Requests are routed through `clinicq_backend.urls`, exposing admin, token login, and versioned API paths backed by DRF routers.【F:apps/backend/clinicq_backend/urls.py†L17-L24】【F:apps/backend/api/urls.py†L1-L30】
- **Deployment tooling** – Containerization is handled via a Python 3.12 Dockerfile and a bash entrypoint that performs migrations, collects static files, and optionally provisions a superuser before launching Gunicorn.【F:apps/backend/Dockerfile†L1-L40】【F:apps/backend/entrypoint.sh†L1-L25】

## Directory Structure & Responsibilities
- `api/` – Core domain logic (models, serializers, viewsets, permissions, Google Drive integration) plus Django admin registration and management commands.【F:apps/backend/api/views.py†L1-L216】【F:apps/backend/api/google_drive.py†L1-L30】【F:apps/backend/api/management/commands/export_audit_log.py†L1-L111】
- `clinicq_backend/` – Project configuration (settings, ASGI/WSGI, URL routing).【F:apps/backend/clinicq_backend/settings.py†L1-L300】
- `server/static/` – Shared static assets bundled for delivery via WhiteNoise.【F:apps/backend/clinicq_backend/settings.py†L160-L174】
- `tests/` & `api/test_*.py` – Pytest suites covering API behaviors, admin, models, migrations, permissions, and deployment smoke tests, configured through `pytest.ini` with coverage thresholds and migration checks enabled.【F:apps/backend/pytest.ini†L1-L6】【F:apps/backend/api/test_api.py†L1-L200】

## API Surface & Behavior
- **Patient operations** – `PatientViewSet` offers CRUD, a cached search endpoint, and pagination while clearing cache on write operations. Logging is emitted for auditing changes.【F:apps/backend/api/views.py†L75-L200】
- **Visit workflow** – `VisitViewSet` enforces role-based transitions (assistant creates, doctor moves states) and auto-assigns queue-specific tokens using visit status helpers.【F:apps/backend/api/views.py†L201-L320】
- **Prescription imaging** – `PrescriptionImageViewSet` mandates doctor permissions for writes and integrates with Google Drive uploads; failures log errors but still create placeholder records to avoid request loss.【F:apps/backend/api/views.py†L321-L403】
- **System endpoints** – `/api/health/` is publicly accessible for monitoring; `/api/auth/me/` provides authenticated role introspection.【F:apps/backend/api/views.py†L36-L68】

## Data Model Review
- **Registration number length bug** – `Patient.registration_number` is constrained to `max_length=8`, yet the enforced pattern (`xx-xx-xxx`) requires nine characters (including hyphens). This mismatch prevents valid values from passing model validation and should be increased to at least 9.【F:apps/backend/api/models.py†L8-L69】
- **Token uniqueness guarantees** – Visit tokens are scoped by queue and date via a composite uniqueness constraint, but concurrent creations still risk `IntegrityError`; consider database-level locking or retries around `perform_create` to harden multi-device usage.【F:apps/backend/api/models.py†L49-L58】【F:apps/backend/api/views.py†L248-L286】
- **Auto-registration concurrency** – `Patient.generate_next_registration_number` derives the next ID by reading the latest record; without transactions, simultaneous creations from web and Android clients could collide. Wrapping the generator in a database lock or switching to a sequence would make it safe at scale.【F:apps/backend/api/models.py†L84-L108】

## Authentication, Authorization & CORS
- **Default protections** – DRF defaults enforce token or session authentication plus `IsAuthenticated`, with group-scoped custom permissions (`IsDoctor`, `IsAssistant`, `IsDisplay`) applied to critical actions.【F:apps/backend/clinicq_backend/settings.py†L212-L220】【F:apps/backend/api/permissions.py†L1-L34】【F:apps/backend/api/views.py†L201-L236】
- **Multi-platform access** – CORS is configurable via environment variables and allows credentials, enabling browser-based clients, while native Android apps can authenticate via token headers without CORS restrictions.【F:apps/backend/clinicq_backend/settings.py†L221-L255】
- **Secrets & production hardening** – Sensible defaults exist, but environment variables must override the bundled `SECRET_KEY` and enable SSL/HSTS to avoid insecure deployments.【F:apps/backend/clinicq_backend/settings.py†L37-L45】【F:apps/backend/clinicq_backend/settings.py†L258-L300】

## External Integrations
- **Google Drive** – Prescription uploads rely on a service-account JSON path in `GOOGLE_SERVICE_ACCOUNT_FILE`; missing credentials raise runtime errors. For resilience, add feature flags or queueing if the Drive API is unavailable.【F:apps/backend/api/google_drive.py†L10-L30】【F:apps/backend/api/views.py†L351-L398】
- **Audit export command** – `export_audit_log` emits JSON/CSV snapshots for patients, visits, and queues, supporting compliance exports and offline verification.【F:apps/backend/api/management/commands/export_audit_log.py†L11-L111】

## Testing & Quality Gates
- Pytest is configured with coverage enforcement and the `django-test-migrations` plugin, but running the suite currently fails because that plugin is not installed in the default environment—install `requirements-dev.txt` before executing CI to satisfy workflow expectations.【F:apps/backend/pytest.ini†L1-L6】【F:apps/backend/requirements-dev.txt†L1-L11】【5df766†L1-L44】

## Recommended Actions
1. **Fix patient ID length** – Increase `max_length` (and accompanying serializer validation/tests) to accept nine-character registration numbers.【F:apps/backend/api/models.py†L61-L69】
2. **Harden ID/token generation** – Introduce transactional locking or retry logic around patient registration and visit token issuance to avoid race conditions under concurrent multi-client load.【F:apps/backend/api/models.py†L84-L108】【F:apps/backend/api/views.py†L248-L286】
3. **Document/automate Drive credentials** – Provide deployment guidance or health checks for Google Drive configuration to prevent runtime failures when credentials are absent.【F:apps/backend/api/google_drive.py†L10-L30】
4. **Ensure CI dependencies** – Update workflow setup scripts to install `requirements-dev.txt` so pytest (with migration checks and coverage) executes reliably in all pipelines.【F:apps/backend/requirements-dev.txt†L1-L11】【5df766†L1-L44】
5. **Review security posture** – Enforce production environment variables (secret key, allowed hosts, HTTPS flags) during deployment scripts to guarantee consistent hardening across web and mobile channels.【F:apps/backend/clinicq_backend/settings.py†L37-L45】【F:apps/backend/clinicq_backend/settings.py†L258-L300】

