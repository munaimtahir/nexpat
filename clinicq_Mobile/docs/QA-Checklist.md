# QA Checklist
- [ ] Login: wrong creds, server down, expired token.
- [ ] Role routing: assistant/doctor/admin paths.
- [ ] Patients: search edge-cases, validation errors.
- [ ] Visits: transitions valid/invalid; concurrency.
- [ ] Uploads: large images, no network, retry.
- [ ] Offline: create/edit queued, replay on reconnect.
- [ ] Accessibility: TalkBack, font scale, RTL.
- [ ] Performance: cold start, list scroll, memory.
- [ ] Security: logs redact, token wipe on logout.
