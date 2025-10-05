# Final AI Developer Prompt (Autonomous)
You are building **ClinicQ Mobile** (React Native / Expo) that connects to Django/DRF.

## Mission
Deliver an MVP with login, role routing (assistant/doctor), patients, queue, uploads, offline read cache + write outbox, using the API defined in `API.md` and the generated client.

## Stack
- React Native (Expo), TypeScript
- React Navigation, Axios, @tanstack/react-query
- react-native-encrypted-storage
- react-hook-form + zod
- expo-image-picker, expo-file-system
- Sentry, Detox (E2E), Jest/RTL

## Steps
1. Scaffold app; add `.env` for `SERVER_URL`.
2. Implement `api/client` using generated OpenAPI types; axios interceptors for DRF token auth.
3. Screens: Login → role routing → Assistant/Doctor dashboards.
4. Patients: list/search/detail/form (zod validation).
5. Visits: list/enqueue/update; optimistic updates where safe.
6. Uploads: camera/gallery → multipart → progress, retry.
7. Offline: React Query persist; write outbox & replay.
8. Diagnostics screen; error boundaries; i18n; accessibility.
9. CI: build/test; produce internal build artefacts.
