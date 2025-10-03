# CI/CD — GitHub Actions + Expo EAS

## Pipelines
1) **PR Validation**: install → lint → typecheck → unit tests (coverage)
2) **E2E (Detox)**: optional on tagged branch
3) **Build (EAS)**: Android build on tags; store artifacts

## Secrets
SENTRY_AUTH_TOKEN, SENTRY_DSN_PROD, EAS_TOKEN, SERVER_URL, FIREBASE_*

## Example Workflow
```yaml
name: mobile-ci
on:
  pull_request:
  push:
    branches: [ main ]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
  build-android:
    needs: validate
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EAS_TOKEN }}
      - run: npx eas build --platform android --non-interactive
```
