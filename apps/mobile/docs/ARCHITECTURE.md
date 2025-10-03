# Architecture
## Mobile App
```
app/
  api/          # generated client + axios wrapper
  screens/      # Login, Assistant, Doctor, Patients, PatientForm, Display, Settings
  components/   # UI atoms/molecules
  store/        # auth state
  hooks/        # useAuth, useApi, useOnlineStatus
  services/     # uploads, notifications (later)
  utils/        # validators, date
```
- **Auth:** JWT (access+refresh). Secure storage at rest.
- **Data:** React Query cache; pagination; optimistic updates where safe.
- **Offline:** Persisted cache + queued writes with idempotency keys.
- **Uploads:** Multipart with progress; compress large images on-device.
- **Internationalization:** i18next (en/ur), RTL support.
- **Observability:** Sentry; redact sensitive fields.
