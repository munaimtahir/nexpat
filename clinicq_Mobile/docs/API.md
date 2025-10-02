# API & Interfaces
## Auth
- `POST /api/auth/login/` → { access, refresh } or { token }
- `POST /api/auth/refresh/` → { access } (if JWT)
- `GET /api/auth/me/` → { id, username, roles[] }

## Patients
- `GET /api/patients/?search=&page=`
- `POST /api/patients/`
- `PATCH /api/patients/{id}/`

## Visits
- `GET /api/visits/?status=&page=`
- `POST /api/visits/`
- `PATCH /api/visits/{id}/` (e.g., status transitions)

## Prescriptions
- `POST /api/prescriptions/` (multipart: image + patient + visit?)

## Health & Version
- `GET /api/health/`
- `GET /api/version/`

> Maintain OpenAPI via drf-spectacular at `/api/schema/`. Clients must be generated from this schema before merge.
