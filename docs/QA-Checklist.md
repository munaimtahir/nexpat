# QA Checklist — Release Readiness

## Functional
- [ ] Auth + role routing
- [ ] Patients CRUD & search
- [ ] Visits status flow
- [x] Uploads (capture/gallery/queued/retry/thumbnails/viewer)
- [x] Offline outbox & replay; conflict handling

## UX polish
- [ ] English copy review
- [ ] Localized dates/times (deferred until after launch)
- [x] Cached vs live indicators

## Accessibility
- [x] Labels on all touchables
- [ ] Contrast & font scaling
- [ ] Keyboard navigation (where applicable)

## Performance
- [x] FlatList virtualization
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
