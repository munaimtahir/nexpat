# ClinicQ Front-End Audit

## Scope and Methodology
- Reviewed the web SPA under `apps/web` and the React Native mobile client under `apps/mobile`, including routing, state management, data access layers, and supporting configuration.
- Cross-referenced README and status documentation to confirm intended architecture and workflows.
- Ran linting and unit tests for both applications to verify the health of existing automation and inspect coverage reports.

## Repository Layout and Build Pipelines
- Applications are grouped beneath `apps/` with dedicated README files describing build and runtime expectations for backend, web, and mobile targets.【F:apps/README.md†L1-L41】
- The web client is a Vite 7 + React 19 SPA with Tailwind styling and Jest/Testing Library for tests, configured through `package.json` and `vite.config.js` (which proxies `/api` to the Django backend during local development).【F:apps/web/README.md†L1-L62】【F:apps/web/package.json†L1-L40】【F:apps/web/vite.config.js†L1-L17】
- The mobile client is an Expo SDK 50 project using React Navigation, React Query, and secure storage. Build metadata and environment injection live in `app.config.ts` and `.env` variables consumed by `env.serverUrl`.【F:apps/mobile/package.json†L1-L80】【F:apps/mobile/app.config.ts†L1-L34】【F:apps/mobile/src/utils/environment.ts†L1-L13】

## Web Application Review (`apps/web`)
### Routing, Auth, and Role Segmentation
- `App.jsx` defines the route map, exposing assistant, doctor, display, and patient management portals. Each protected route is wrapped in `ProtectedRoute`, and the landing page surfaces links dynamically based on the authenticated roles.【F:apps/web/src/App.jsx†L1-L163】
- `AuthContext.jsx` loads roles via `/auth/me/`, memoizes helpers such as `hasRole`, and exposes `logout` for session resets. Role refresh runs on demand from `ProtectedRoute`.【F:apps/web/src/AuthContext.jsx†L1-L63】【F:apps/web/src/components/ProtectedRoute.jsx†L1-L60】
- `api.js` centralizes axios configuration, normalizes `VITE_API_BASE_URL`, injects the short-lived token, and redirects on 401 responses. This keeps navigation and API state in sync with backend auth requirements.【F:apps/web/src/api.js†L1-L88】

### Feature Workflows and Data Fetching
- Assistant/doctor flows query visits, join patient details, and handle prescription uploads in `DoctorPage.jsx`, demonstrating chunked requests and optimistic refresh on status changes.【F:apps/web/src/pages/DoctorPage.jsx†L1-L120】
- Utilities like `unwrapListResponse` normalize paginated responses, supporting both array and `{results: []}` payloads from the backend.【F:apps/web/src/utils/api.js†L1-L16】

### UI Components and Accessibility Observations
- Shared UI primitives (such as `StatusBadge` and `TimeStamp`) encapsulate status chips and timestamp formatting for reuse across dashboards.【F:apps/web/src/components/StatusBadge.jsx†L1-L70】【F:apps/web/src/components/TimeStamp.jsx†L1-L83】
- **Issue:** `TimeStamp` calls `toLocaleDateString` even when time components are requested, which strips hours/minutes from "datetime"/"full" formats. Switching to `toLocaleString` (or `Intl.DateTimeFormat`) would render complete timestamps.【F:apps/web/src/components/TimeStamp.jsx†L21-L57】
- Tailwind classes drive layout, and login inputs include `sr-only` labels for screen readers, aligning with accessibility best practices.【F:apps/web/src/pages/LoginPage.jsx†L1-L89】

### Testing and Quality Signals
- ESLint covers JS/JSX with React hooks rules and test-specific globals. Lint passes cleanly (`npm run lint`).【F:apps/web/eslint.config.js†L1-L39】【2ffd78†L1-L40】
- Jest runs six suites (22 tests) with ~49% line coverage. Key gaps are in high-value pages (`LoginPage`, `PatientFormPage`, `PatientsPage`) and shared components (coverage near 0%), indicating critical workflows lack automated regression protection.【2ffd78†L1-L41】

### Web Recommendations
1. **Fix `TimeStamp` formatting** to preserve time data and reduce user confusion around visit event timestamps.【F:apps/web/src/components/TimeStamp.jsx†L21-L71】
2. **Expand test coverage** for authentication flows, patient CRUD pages, and shared component exports (`components/index.js`) to raise coverage above the current 50% plateau and guard against regressions.【2ffd78†L1-L41】
3. **Consider request cancellation** for long-running visit fetches in `DoctorPage` to avoid updating state after unmount, especially when navigation is fast or concurrency increases.【F:apps/web/src/pages/DoctorPage.jsx†L1-L108】

## Mobile Application Review (`apps/mobile`)
### Architecture and Providers
- `AppProviders` composes Sentry, i18n, React Query (with AsyncStorage persistence), React Navigation, and the auth/outbox layers, establishing a robust foundation for offline-aware UX.【F:apps/mobile/src/providers/AppProviders.tsx†L1-L93】
- The auth context persists JWT pairs in encrypted storage, refreshes the profile on login, and wires user context into Sentry for diagnostics.【F:apps/mobile/src/features/auth/AuthContext.tsx†L1-L70】

### Networking, Offline, and Backend Alignment
- `api/client.ts` wraps axios with token refresh, offline queuing for non-GET requests, and integration with the generated OpenAPI client. Both login and refresh hit `/api/auth/...` endpoints, matching the web client's expectations.【F:apps/mobile/src/api/client.ts†L1-L127】【F:apps/mobile/src/api/generated/client.ts†L16-L76】
- Outbox operations serialize queued mutations and persist them via encrypted storage, with subscription hooks for UI feedback.【F:apps/mobile/src/api/outbox/outbox.ts†L1-L81】【F:apps/mobile/src/storage/secureStore.ts†L1-L17】
- Environment utilities default to `http://localhost:8000` but honor `SERVER_URL` from Expo config, enabling shared backend access when deployed with the web app.【F:apps/mobile/src/utils/environment.ts†L1-L13】【F:apps/mobile/app.config.ts†L1-L34】

### Navigation and Role Handling
- React Navigation stacks and tab navigators branch by role, mirroring the web's assistant/doctor experiences and providing kiosk/diagnostics flows as dedicated screens.【F:apps/mobile/src/navigation/index.tsx†L1-L95】【F:apps/mobile/src/constants/index.ts†L1-L13】

### Quality and Tooling Signals
- ESLint runs but emits a warning: the project relies on TypeScript 5.9, which is outside the supported range for the current `@typescript-eslint` toolchain. Upgrading the lint stack (or downgrading TypeScript) will restore full support.【68a519†L1-L11】
- Jest executes three suites (6 tests) focused on the offline outbox; other high-impact screens remain untested. CI currently tolerates missing suites via `--passWithNoTests`, so regressions could slip through until broader coverage exists.【95ac74†L1-L7】【F:apps/mobile/package.json†L9-L31】
- Documentation in `docs/STATUS.md` confirms that Phase 4 (quality and release hardening) is still in progress, noting the same gaps in automated tests, accessibility, and observability.【F:apps/mobile/docs/STATUS.md†L1-L115】

### Mobile Recommendations
1. **Resolve TypeScript tooling mismatch** by updating `@typescript-eslint` packages (or pinning TypeScript ≤5.3) to eliminate lint warnings and ensure future compatibility.【68a519†L1-L11】
2. **Broaden Jest/RTL coverage** across authentication, navigation guards, and major screens. Remove `--passWithNoTests` once suites exist to enforce minimum coverage thresholds.【F:apps/mobile/package.json†L9-L31】【95ac74†L1-L7】
3. **Harden offline replay** with integration tests for the outbox processor to validate retry ordering, media uploads, and conflict resolution referenced as open risks in project docs.【F:apps/mobile/src/api/outbox/outbox.ts†L1-L81】【F:apps/mobile/docs/STATUS.md†L41-L98】

## Cross-Platform Backend Access
- Both clients target the same REST surface under `/api`, sharing endpoints for auth, patients, visits, and prescriptions. The web client appends `/api` automatically when `VITE_API_BASE_URL` omits it, while the mobile client reads `SERVER_URL` and always prefixes requests with `/api/...` through the generated client.【F:apps/web/src/api.js†L7-L67】【F:apps/mobile/src/api/generated/client.ts†L19-L76】
- Local development proxying (Vite → Django) and Expo `serverUrl` configuration support simultaneous access to a single backend instance for web and Android builds. Keep `.env` values aligned across apps during deployment to avoid mismatched hosts.【F:apps/web/vite.config.js†L5-L15】【F:apps/mobile/src/utils/environment.ts†L8-L13】

## Test Execution Summary
- `npm run lint` (web) ✔️
- `npm run test -- --runInBand` (web) ✔️ – 6/6 suites passed, ~49% coverage.【2ffd78†L1-L41】
- `npm run lint` (mobile) ⚠️ – Succeeds with TypeScript support warning (toolchain incompatibility).【68a519†L1-L11】
- `npm run test -- --runInBand` (mobile) ✔️ – 3/3 suites passed (outbox focus).【95ac74†L1-L7】

## Prioritized Next Steps
1. Patch the `TimeStamp` formatting bug and add regression tests for date/time rendering across locales.【F:apps/web/src/components/TimeStamp.jsx†L21-L71】
2. Increase automated coverage for auth and patient management features on both platforms, retiring `--passWithNoTests` in the mobile project once suites exist.【2ffd78†L1-L41】【95ac74†L1-L7】
3. Modernize the mobile lint toolchain to support TypeScript 5.9 or pin TypeScript to the supported range to silence warnings and ensure long-term compatibility.【68a519†L1-L11】
4. Continue Phase 4 hardening tasks documented in `apps/mobile/docs/STATUS.md`, including accessibility reviews, telemetry wiring, and release automation, so mobile/web parity extends beyond feature completeness.【F:apps/mobile/docs/STATUS.md†L41-L115】
