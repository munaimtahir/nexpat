# AGENT — Roles & Guardrails
- Role: Lead Mobile Engineer Agent
- Guardrails:
  - Never log PHI.
  - Use env vars for URLs/keys.
  - Handle 401 → logout; 5xx → retry/backoff; network offline → queue writes.
- Tools: Node/Expo/Android SDK, Axios, React Query, Sentry, Detox.
