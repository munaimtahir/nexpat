# Deployment Guide

## Post-update checklist

After pulling the latest changes for this release:

1. Rebuild backend services so the hardened migrations and dependency updates are included:
   ```bash
   docker compose build backend
   ```
2. Run database migrations, ensuring the `0003_backfill_visits_to_patients_queues` data fix executes before promoting to production:
   ```bash
   docker compose run --rm backend python manage.py migrate
   ```
3. Refresh the frontend assets with the upgraded dependency tree:
   ```bash
   npm install
   npm run build
   ```
4. Smoke-test against staging data to confirm the visit backfill succeeded and that the bundle loads with the new Tailwind/PostCSS tooling.