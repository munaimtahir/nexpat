# ClinicQ Mobile

React Native (Expo) mobile client for ClinicQ. The app uses the generated API client in `src/api/generated` and Axios interceptors for authentication, offline queueing, and upload retries.

## Getting started

```bash
npm install
npx expo start
```

Create a `.env` file or edit `.env.example` to configure the API base URL and Sentry DSN.

```
SERVER_URL=https://api.example.com
SENTRY_DSN=
```

### Project assets

To keep the repository free of binary blobs, icon and splash assets are not committed. Generate them locally with the Expo CLI (for example `npx expo generate-icons`) and keep the outputs outside of version control.

## Key features

- Secure login with JWT refresh and encrypted token storage
- Role-based navigation for assistants and doctors
- Patients and visits management with optimistic updates
- Photo uploads with progress, retry, and offline queuing
- React Query cache persistence plus write outbox replay
- Diagnostics dashboard for health, version, and session management
