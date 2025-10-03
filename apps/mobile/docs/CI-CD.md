# CI/CD
## Backend
- On schema changes: regenerate OpenAPI JSON, commit, and publish.
- Contract check job ensures clients are up-to-date.

## Mobile
- GitHub Actions:
  - lint/typecheck/test
  - build Android (EAS or Gradle-managed)
  - export artifacts for internal testers
- Sentry release + source maps upload
- Tracks: internal → closed → production
