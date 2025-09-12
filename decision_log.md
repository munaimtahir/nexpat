# Decision Log

This file records notable design decisions and changes.

Format: Date | Stage | Decision

---
2025-09-12 | Stage 1 | Final Cleanup: Switched from `@admin.register` decorator to `admin.site.register()` in `api/admin.py` to ensure models are reliably registered with the Django admin. Added a regression test to confirm registration.
2025-09-12 | Stage 1 | Final Cleanup: Set frontend API `baseURL` in `src/api.js` to use `VITE_API_BASE_URL` environment variable for flexible deployment.
2025-09-12 | Stage 1 | Final Cleanup: Confirmed `api/models.py` has no placeholders and matches the schema defined in migrations.
2025-09-12 | Stage 1 | Final Cleanup: Confirmed migration `0003_backfill_visits_to_patients_queues.py` is complete with a reversible data migration and tested it on a fresh database.
2025-09-07 | Stage 1 | Fix Assistant → Create Visit: Changed frontend to send patient registration_number instead of id. Corrected backend validation and tests for patient filtering.
