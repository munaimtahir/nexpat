# AI Agent — Execution Brief (ClinicQ Mobile)

## Mission
Complete **Phase 3** (uploads/offline UX) and **Phase 4** (quality & release) and prepare the **Android** production release.

## Constraints
Expo SDK 50 · TypeScript · React Query v5 · Axios interceptors · RN Paper · SecureStore/AsyncStorage · i18next · Jest/RTL/Detox · Sentry · GitHub Actions + EAS Build.

## Scope
- **Phase 3**: Offline UX (cached/live, queued banners, conflict handling); Uploads (thumbnails, batch, viewer).
- **Phase 4**: Accessibility, Tests (unit/component/integration/Detox; >70% coverage), CI/CD (Actions + EAS), Performance, Prod Readiness (error boundaries, Sentry prod, FCM, deep links, store assets, privacy/ToS), Release process.

## Deliverables
Code + tests, CI/CD pipelines, EAS artifacts, updated docs, release guide.

## Guardrails
Small PRs, follow repo structure, add tests+docs with features, align with decisions/roadmap.

## Quick Start
```
npm install
cp ENV.sample .env   # set SERVER_URL
npx expo start
npm run android
```
