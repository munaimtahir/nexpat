# ClinicQ API Overview

The ClinicQ backend exposes a RESTful API under the `/api/` prefix. Authentication
uses Django REST Framework's token authentication and currently supports only
login—tokens are short-lived in the frontend (kept in memory) and **no refresh
endpoint is provided**. When a token expires or becomes invalid the frontend will
clear its session and redirect the user to log in again.

The following endpoints are useful during development. Replace `<id>` or `<reg_no>`
with the appropriate identifiers.

## Authentication
- `POST /api/auth/login/` – Retrieve a token for subsequent API calls (include `username` and `password` in the body)

## Patients
- `GET /api/patients/` – List patients
- `POST /api/patients/` – Create a patient (requires `name`, `gender`, `category`; auto-generates registration number in format `mmyy-ct-0000`)
- `GET /api/patients/<reg_no>/` – Retrieve a patient by registration number (e.g., `1025-01-0001`)
- `PUT /api/patients/<reg_no>/` – Replace a patient record
- `PATCH /api/patients/<reg_no>/` – Partially update a patient record
- `DELETE /api/patients/<reg_no>/` – Remove a patient
- `GET /api/patients/search/?q=<query>` – Search patients by registration number, name, or phone

### Patient Model
- `registration_number` (string, primary key): Format `mmyy-ct-0000` where:
  - `mmyy`: Month and year of registration (e.g., 1025 = October 2025)
  - `ct`: Category code (01=self-paying, 02=insurance, 03=cash, 04=free, 05=poor)
  - `0000`: Serial number, unique for each month/category combination
- `name` (string, required): Patient's full name
- `phone` (string, optional): Patient's phone number
- `gender` (string, required): One of MALE, FEMALE, OTHER
- `category` (string, required): Payment category code (01-05)
- `created_at` (datetime): Record creation timestamp
- `updated_at` (datetime): Record update timestamp

## Visits
- `POST /api/visits/` – Create a new visit (token)
- `GET /api/visits/?status=WAITING[&queue=<id>]` – List waiting visits, optionally filtered by queue
- `PATCH /api/visits/<id>/done/` – Mark a visit as done

## Queues
- `GET /api/queues/` – List available service queues

For a browsable interface, start the backend and navigate to
`http://localhost:8000/api/` in your browser.
