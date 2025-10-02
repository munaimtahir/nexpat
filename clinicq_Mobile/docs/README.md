# ClinicQ Mobile (Android) — Dev Plan Pack
**Date:** 2025-10-02

This pack defines how to build a **separate Android app** that uses the **same Django/DRF backend** as ClinicQ Web. Web and Mobile stay **in sync** via a shared **OpenAPI contract**, common auth, and aligned release cadence. iOS is planned for the future via React Native (Expo EAS).

## Repos
- **clinicq-backend** — Django/DRF (source of truth).
- **clinicq-web** — React/Vite SPA.
- **clinicq-mobile** — NEW React Native/Expo app (this plan).
- *(optional later)* **packages/api-client** — generated typed client from OpenAPI.

## Highlights
- JWT auth for both clients, identical endpoints & roles.
- Shared OpenAPI schema → generated clients for web & mobile.
- Mobile adds offline cache + write outbox; uploads via camera/gallery.
- Release gates: schema changes must regenerate clients before merge.
