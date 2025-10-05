# API & Interfaces
## Auth
- `POST /api/auth/login/` → { access, refresh }
- `POST /api/auth/refresh/` → { access }
- `GET /api/auth/me/` → { username, roles[] }

## Patients
- `GET /api/patients/?page=&registration_numbers=` (comma-separated)
- `GET /api/patients/search/?q=` (text search, paginated)
- `GET /api/patients/{registration_number}/`
- `POST /api/patients/` → body `{ name, phone?, gender? }`
- `PATCH /api/patients/{registration_number}/` → partial `{ name?, phone?, gender? }`

## Visits
- `GET /api/visits/?status=&queue=&page=` (status accepts uppercase values e.g. `WAITING`)
- `GET /api/visits/{id}/`
- `POST /api/visits/` → `{ patient: <registration_number>, queue: <queue_id> }`
- `PATCH /api/visits/{id}/` → update queue only
- `PATCH /api/visits/{id}/start/`, `/in_room/`, `/done/`, `/send_back_to_waiting/` → status transitions (server enforces allowed transitions)

## Prescriptions
- `POST /api/prescriptions/` (multipart: `visit`, optional `patient`, file field `image`)

## Health & Version
- `GET /api/health/`

> Maintain OpenAPI via drf-spectacular at `/api/schema/`. Clients must be generated from this schema before merge.
