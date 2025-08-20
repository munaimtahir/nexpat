# ClinicQ API Overview

The ClinicQ backend exposes a RESTful API under the `/api/` prefix.
The following endpoints are useful during development. Replace `<id>` or `<reg_no>`
with the appropriate identifiers.

## Patients
- `GET /api/patients/` – List patients
- `POST /api/patients/` – Create a patient
- `GET /api/patients/<reg_no>/` – Retrieve a patient by registration number
- `PUT /api/patients/<reg_no>/` – Replace a patient record
- `PATCH /api/patients/<reg_no>/` – Partially update a patient record
- `DELETE /api/patients/<reg_no>/` – Remove a patient
- `GET /api/patients/search/?q=<query>` – Search patients by registration number, name, or phone

## Visits
- `POST /api/visits/` – Create a new visit (token)
- `GET /api/visits/?status=WAITING[&queue=<id>]` – List waiting visits, optionally filtered by queue
- `PATCH /api/visits/<id>/done/` – Mark a visit as done

## Queues
- `GET /api/queues/` – List available service queues

For a browsable interface, start the backend and navigate to
`http://localhost:8000/api/` in your browser.
