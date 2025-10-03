# Decision Log

This file records notable design decisions and changes.

Format: Date | Stage | Decision

---
2025-09-12 | Stage 2 | Expanded `Visit` lifecycle to include `START` and `IN_ROOM` statuses. Implemented corresponding actions (`start`, `in_room`, `send_back_to_waiting`, `done`) in the `VisitViewSet` with strict state transition validation.
2025-09-12 | Stage 2 | Implemented comprehensive Role-Based Access Control (RBAC). Created `Admin`, `Doctor`, `Assistant`, and `Display` groups via data migration. Added `IsAdmin` and `IsDisplay` permission classes and secured all relevant API endpoints.
2025-09-12 | Stage 2 | Updated the Doctor UI (`DoctorPage.jsx`) to provide buttons for managing the new visit lifecycle. The UI now dynamically displays actions based on the visit's current status.
2025-09-12 | Stage 2 | Revamped the Public Display UI (`PublicDisplayPage.jsx`) to distinguish between `IN_ROOM` and `WAITING` patients. `IN_ROOM` patients are now prominently highlighted, providing clearer information to waiting patients.
2025-09-12 | Stage 1 | Final Cleanup: Switched from `@admin.register` decorator to `admin.site.register()` in `api/admin.py` to ensure models are reliably registered with the Django admin. Added a regression test to confirm registration.
2025-09-12 | Stage 1 | Final Cleanup: Set frontend API `baseURL` in `src/api.js` to use `VITE_API_BASE_URL` environment variable for flexible deployment.
2025-09-12 | Stage 1 | Final Cleanup: Confirmed `api/models.py` has no placeholders and matches the schema defined in migrations.
2025-09-12 | Stage 1 | Final Cleanup: Confirmed migration `0003_backfill_visits_to_patients_queues.py` is complete with a reversible data migration and tested it on a fresh database.
2025-09-07 | Stage 1 | Fix Assistant → Create Visit: Changed frontend to send patient registration_number instead of id. Corrected backend validation and tests for patient filtering.
