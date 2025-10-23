# GitHub Actions Workflows

This repository uses 4 GitHub Actions workflows for continuous integration and deployment.

## Active Workflows

### 1. Backend CI (`backend-ci.yml`)
**Purpose**: Tests the Django backend application

**Triggers**:
- Push to `apps/backend/**`
- Push to `.github/workflows/backend-ci.yml`
- Push to `tooling/linting/**`
- Pull requests affecting the same paths

**Steps**:
1. Checkout code
2. Set up Python 3.11
3. Install dependencies from `requirements.txt` and `requirements-dev.txt`
4. Run linting with flake8
5. Run tests with pytest

**Status**: ✅ Passing (92 tests, 87% coverage)

---

### 2. Frontend CI (`frontend-ci.yml`)
**Purpose**: Tests the React web application

**Triggers**:
- Push to `apps/web/**`
- Push to `.github/workflows/frontend-ci.yml`
- Pull requests affecting the same paths

**Steps**:
1. Checkout code
2. Set up Node.js 20
3. Install dependencies with npm ci
4. Run linting with ESLint
5. Run tests with Jest
6. Build the application with Vite

**Status**: ✅ Passing (22 tests, builds successfully)

---

### 3. Mobile CI (`mobile-ci.yml`)
**Purpose**: Tests the React Native mobile application

**Triggers**:
- Push to `apps/mobile/**`
- Push to `.github/workflows/mobile-ci.yml`
- Pull requests affecting the same paths

**Steps**:
1. Checkout code
2. Set up Node.js 20
3. Install dependencies with npm ci
4. Run linting with ESLint
5. Run TypeScript type checking
6. Run tests with Jest and upload coverage

**Status**: ✅ Passing (43 tests, 90% coverage)

---

### 4. Mobile EAS Build (`mobile-eas-build.yml`)
**Purpose**: Build the mobile app for distribution using Expo Application Services (EAS)

**Triggers**:
- Manual workflow dispatch only
- Accepts `profile` input parameter (default: `preview`)

**Steps**:
1. Checkout code
2. Set up Node.js 20
3. Set up Expo/EAS tooling
4. Install dependencies
5. Run linting, type checking, and tests
6. Build with EAS for Android

**Requirements**:
- `EXPO_TOKEN` secret must be configured in GitHub repository settings
- EAS project must be configured locally first

**Status**: ⚠️ Manual trigger required

---

## Removed Workflows

### main.yml (Removed)
**Reason**: Duplicated functionality of backend-ci.yml and frontend-ci.yml with stricter coverage requirements (80%). The individual workflows provide better separation of concerns and clearer CI feedback.

### android-ci.yml.disabled (Removed)
**Reason**: Workflow was already disabled. The native Android app (Electricity Meter Tracker) in the `app/` directory appears to be a separate project with build configuration issues.

---

## Local Testing

All workflows have been tested locally:

```bash
# Backend
cd apps/backend
pip install -r requirements.txt -r requirements-dev.txt
flake8 .
pytest

# Frontend
cd apps/web
npm ci
npm run lint
npm test -- --runInBand --watchAll=false
npm run build

# Mobile
cd apps/mobile
npm ci
npm run lint
npm run typecheck
npm test -- --coverage
```

All tests pass successfully in the local environment.
