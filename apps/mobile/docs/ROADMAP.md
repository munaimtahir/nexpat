# Roadmap
## Phase 1 — Foundations
- Create `clinicq-mobile` repo (Expo).
- Add navigation, theme, Axios client, React Query, secure token storage.
- Implement Login + `/auth/me` with role-based routing.
- Expose OpenAPI on backend and add client-generation script.

## Phase 2 — Core Workflows
- Patients: list/search/create/edit.
- Visits/Queue: list/enqueue/update status transitions.
- Assistant & Doctor dashboards with polling.

## Phase 3 — Uploads & Offline
- Prescription image upload (camera/gallery) with progress & retry.
- React Query persistence + write outbox (replay on reconnect).
- Public Display screen; kiosk mode.

## Phase 4 — Quality & Release
- Accessibility, performance, and English copy polish.
- E2E (Detox), Sentry, Crash-free sessions > 99%.
- Play Console assets; internal → closed → production tracks.
