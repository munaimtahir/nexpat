# Development Status

**Last Updated:** 2025-03-21 (reviewed and validated)
**Current Phase:** Phase 3 (Uploads & Offline) ✅ Complete · Phase 4 (Quality & Release) 🚧 In Progress

## Executive Summary

The ClinicQ Mobile app is a React Native (Expo) application that provides a mobile interface for clinic management. The application is currently in **Phase 3** of development with most core features completed and working. The app is functional but not yet production-ready.

### Current Stage: **MVP Complete + Advanced Features**

The application has completed all Phase 1 & 2 foundational work and the Phase 3 offline/upload program. Phase 4 focuses on stability, coverage, and release operations.

### Recent Validation (2025-03-14)
- `npm run lint`
- `npm run typecheck`
- `npm run test`

---

## Feature Readiness Overview

### Decision Log

- **2025-03-21 — Auth Tokens**: Confirmed that both web and mobile clients will continue using the existing DRF token login. The mobile app now stores a single `{ token }` value and sends `Authorization: Token …` headers; no refresh endpoint is required.

### ✅ Ready to Ship (feature-complete & stable in manual testing)

- **Authentication & Role Routing** – Credential login with DRF token storage (single token) and role-sensitive navigation across assistant and doctor tab stacks. (`src/screens/LoginScreen.tsx`, `src/api/client.ts`, `src/navigation/index.tsx`)
- **Patient Management** – Searchable patient lists, detail view, and create/edit flows with optimistic cache updates and offline notices. (`src/screens/PatientsListScreen.tsx`, `src/screens/PatientDetailScreen.tsx`, `src/screens/PatientFormScreen.tsx`)
- **Visit Queue Operations** – Assistant queue management, doctor workflow, detail drill-down, and conflict handling with optimistic updates. (`src/screens/VisitsQueueScreen.tsx`, `src/screens/DoctorQueueScreen.tsx`, `src/api/hooks/useVisits.ts`)
- **Uploads Hub** – Camera/gallery intake, batch uploads with progress, offline queuing, and gallery of historical prescriptions. (`src/screens/UploadManagerScreen.tsx`, `src/api/hooks/useUploads.ts`)
- **Offline Awareness** – Persistent write outbox, sync banners, cached data badges, and network-aware interceptors. (`src/api/outbox/outbox.ts`, `src/components/SyncStatusBanner.tsx`, `src/components/CachedDataNotice.tsx`, `src/api/client.ts`)
- **Kiosk Display & Diagnostics** – Waiting-room display with keep-awake/offline indicator and diagnostics panel for connectivity + quick admin actions. (`src/screens/PublicDisplayScreen.tsx`, `src/screens/DiagnosticsScreen.tsx`)
- **Tooling Foundations** – Expo SDK 50 project with lint/typecheck/test scripts, secure storage wrappers, React Query persistence, and baseline Jest coverage for the outbox layer. (`package.json`, `src/api/outbox/outbox.test.ts`)

### 🧪 Implemented but Requires Debugging / Hardening

- **~~Automated Test Coverage~~** ✅ **Completed** – Jest, RTL test suites added for LoginScreen (5 tests), PatientsListScreen (8 tests), and outbox edge cases (8 tests). Total test coverage increased from 3 to 6 test suites with 32 tests passing. (`jest.config.js`, `jest.setup.ts`, `package.json`, `src/screens/__tests__/`)
- **~~Accessibility Pass~~** ✅ **Completed** – All interactive components now have consistent `accessibilityLabel` and `accessibilityHint` properties for TalkBack/VoiceOver support. (`src/screens/LoginScreen.tsx`, `src/screens/PatientsListScreen.tsx`, `src/screens/VisitsQueueScreen.tsx`, `docs/QA-Checklist.md`)
- **~~Performance Profiling~~** ✅ **Completed** – FlatLists optimized with virtualization props (`windowSize`, `maxToRenderPerBatch`, `removeClippedSubviews`, `initialNumToRender`) and memoized render callbacks to handle hundreds of rows efficiently. (`src/screens/PatientsListScreen.tsx`, `src/screens/VisitsQueueScreen.tsx`)
- **~~Release Telemetry~~** ✅ **Completed** – Sentry enhanced with environment, release, and session tracking configuration. ErrorBoundary component added with Sentry integration for crash reporting. (`src/providers/sentry.ts`, `src/components/ErrorBoundary.tsx`)
- **Outbox Edge Cases** – Core queueing logic tested with edge cases including race conditions, large payloads, concurrent operations, and multi-subscriber scenarios. 8 new tests added. (`src/api/outbox/outbox.test.ts`, `docs/QA-Checklist.md`)

### ⏳ Pending / Not Started

- **Localization Expansion** – English-only content; Urdu/RTL and locale-specific formatting deferred post v1. (`src/i18n/index.ts`, `apps/mobile/docs/STATUS.md`)
- **Advanced CI/CD** – Manual `mobile-eas-build` workflow exists but needs secrets, release channel wiring, artifact retention, and automated store metadata. (`.github/workflows/mobile-eas-build.yml`, `docs/CI-CD.md`)
- **Production Readiness Tasks** – Push notifications (FCM), deep links, legal docs, marketing assets, and crash-free KPI tracking remain open items. Expo EAS profiles are provisioned, but we still need FCM server key import, universal link domain verification, finalized privacy/ToS PDFs, Play Store/App Store graphic assets, and a crash-free KPI target configured in analytics dashboards. (`apps/mobile/docs/STATUS.md`, `apps/mobile/docs/QA-Checklist.md`)
- **Comprehensive Release Process** – Internal/closed betas, release notes automation, and rollback runbooks remain on the roadmap. (`apps/mobile/docs/STATUS.md`)
- **Future Enhancements** – WebSocket real-time updates, biometrics, reporting, and multi-clinic support are parked for post-1.0. (`apps/mobile/docs/STATUS.md`)

---

## Technical Architecture Snapshot

- **Stack:** Expo (React Native 0.73, TypeScript), React Navigation, React Native Paper, React Query, Axios, SecureStore/AsyncStorage, i18next, Jest/RTL/Detox.
- **Patterns:** Generated OpenAPI client, centralized interceptors with offline queueing, optimistic mutations with cache syncing, role-based navigation wrappers, modular screen architecture.

```
src/
├── api/              # Axios client, generated types, hooks, offline outbox
├── components/       # Reusable UI widgets (cards, status tags, banners)
├── features/         # Domain-specific providers (auth)
├── navigation/       # Stack/tab navigators and route types
├── screens/          # Feature screens (patients, visits, uploads, kiosk)
├── providers/        # App-level providers (query, theme, auth, sentry)
└── utils/            # Environment, logging, formatting helpers
```

---

## Development Workflow

```bash
cd apps/mobile
npm install
cp ENV.sample .env   # configure SERVER_URL
npx expo start
npm run android       # Expo run on emulator/device
npm run lint          # ESLint
npm run typecheck     # TSC
npm test              # Jest (currently minimal coverage)
```

OpenAPI changes can be regenerated with:

```bash
npx openapi-typescript-codegen --input http://localhost:8000/api/schema/ --output src/api/generated
```

**API contract notes:**
- Patient resources use `registration_number` (string) as the identifier and expose `{ name, phone, gender, last_5_visit_dates }`.
- Visit statuses from the backend are uppercase (`WAITING`, `START`, `IN_ROOM`, `DONE`) with transitions handled via dedicated action endpoints (`/start/`, `/in_room/`, `/done/`, `/send_back_to_waiting/`).
- The backend does not expose `/api/version/`; diagnostics show the Expo app version instead.

---

## Known Gaps & Risks

1. **~~Sparse Automated Tests~~** ✅ **Resolved** – Added comprehensive test suites for screens and outbox edge cases. Test coverage increased from 3 to 6 suites with 32 passing tests.
2. **~~Accessibility Debt~~** ✅ **Resolved** – All touchables now have `accessibilityLabel` and `accessibilityHint` properties. Remaining work: contrast checks and font scaling verification.
3. **Release Infrastructure** – EAS builds require secrets, plus store assets/legal docs are outstanding, blocking Play Store submission.
4. **~~Observability~~** ✅ **Improved** – Sentry production configuration enhanced with environment, release tracking, and ErrorBoundary component. Production DSN needs to be configured via environment variables.
5. **Localization** – App ships in English only; multi-lingual support is a post-launch follow-up.
