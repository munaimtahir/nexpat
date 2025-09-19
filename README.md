# OPD Queue Manager

This is a Django + React application for managing outpatient department (OPD) queues.

## Current Status
This project is being developed in **stages** using AI coding agents (Jules + GitHub Copilot).

## Workflow
- **Stage 1**: Core fixes and polishing
- **Stage 2**: Missing features build-out
- **Stage 3**: Deep testing and debugging

See `development_plan.md` and `task_graph.md` for details.

## Authentication Flow

The backend exposes Django REST Framework's token authentication via
`POST /api/auth/login/`. The frontend keeps the returned access token in memory
only; it is **not** persisted to local storage. There is no refresh token
endpoint—when the server responds with `401 Unauthorized`, the frontend clears
any cached token state and redirects users back to the login screen so they can
authenticate again.
