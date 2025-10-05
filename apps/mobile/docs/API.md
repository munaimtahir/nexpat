# API & Interfaces
## Auth
- `POST /api/auth/login/` → { token }
- Clients send `Authorization: Token <token>` on subsequent requests. Tokens are opaque DRF auth tokens with no refresh endpoint.
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
