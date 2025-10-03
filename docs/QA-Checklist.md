# QA Checklist — Release Readiness

## Functional
- [ ] Auth + role routing
- [ ] Patients CRUD & search
- [ ] Visits status flow
- [ ] Uploads (capture/gallery/queued/retry/compression/thumbnails/viewer)
- [ ] Offline outbox & replay; conflict handling

## i18n & UX
- [ ] Urdu/RTL & switcher
- [ ] Localized dates/times
- [ ] Cached vs live indicators

## Accessibility
- [ ] Labels on all touchables
- [ ] Contrast & font scaling
- [ ] Keyboard navigation (where applicable)

## Performance
- [ ] FlatList virtualization
- [ ] Bundle/image optimizations
- [ ] Startup/memory/FPS checks

## Observability
- [ ] Error boundaries
- [ ] Sentry production DSN
- [ ] Crash‑free >99% (beta)

## Store
- [ ] Icons & splash
- [ ] Screenshots & description
- [ ] Privacy & ToS
- [ ] Versioning & release notes
