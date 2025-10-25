# Frontend Docker Development Issue

## Current Status
The frontend Dockerfile.dev encounters an npm installation issue when running inside Docker.  
This is a known npm bug: https://github.com/npm/cli/issues

## Error Message
```
npm error Exit handler never called!
npm error This is an error with npm itself.
```

## Workarounds

### Option 1: Run Frontend Locally (Recommended for Development)
```bash
cd apps/web
npm install
npm run dev
```

The frontend will run on http://localhost:3000 and connect to the backend at http://localhost:8000.

### Option 2: Run Backend in Docker, Frontend Locally
```bash
# In one terminal - start backend
cd infra
docker compose up backend db

# In another terminal - start frontend
cd apps/web
npm install
npm run dev
```

### Option 3: Pre-install Dependencies
If you have node_modules locally, the Docker volume mount will use them:
```bash
cd apps/web
npm install
cd ../../infra
docker compose up
```

## Future Fix
Once the npm bug is resolved or we migrate to yarn/pnpm, the Dockerfile.dev approach will work seamlessly.
