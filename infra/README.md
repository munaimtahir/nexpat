# Infrastructure

This directory contains deployment configurations, scripts, and infrastructure-related assets.

## Structure

### `deploy/`
Deployment scripts and configuration files for production environments:
- Shell scripts for backend/frontend deployment
- systemd service files
- Nginx configuration templates
- Environment variable examples

### `secrets/`
Templates and examples for credential management:
- Service account JSON examples
- `.gitkeep` to maintain directory structure
- **Note:** Never commit actual secrets to this directory

### Docker Compose Files

Located in this directory for easier organization:

- **`docker-compose.yml`** - Local development environment
- **`docker-compose.prod.yml`** - Production configuration

**⚠️ IMPORTANT:** These files use relative paths and **must be run from the `infra/` directory**:

```bash
cd infra
docker-compose up
```

The relative paths (`../apps/backend`, `../apps/web`) are designed to work from this location. If you need to run docker-compose from a different directory, use the `-f` flag with the full path to the compose files:

```bash
# From repository root:
docker-compose -f infra/docker-compose.yml up
```

## Usage

### Local Development

**Run from the infra directory:**
```bash
cd infra
docker-compose up
```

**Or from the repository root using -f flag:**
```bash
docker-compose -f infra/docker-compose.yml up
```

This starts:
- PostgreSQL database (port 54320)
- Django backend (port 8000)
- React frontend (port 5173)

**Note:** The docker-compose.yml file uses relative paths (`../apps/*`) that are resolved from the `infra/` directory. Always run docker-compose from `infra/` or use the `-f` flag with the full path when running from other locations.

### Production Deployment

See `docs/ops/DEPLOYMENT_GUIDE.md` for complete production deployment instructions.

### Secrets Management

1. A placeholder `infra/secrets/gdrive_service.json` is committed so Docker secrets resolve during development.

2. Before deploying, replace the placeholder with real credentials supplied by your secret manager **outside of version control** (e.g., copy the managed secret into place on the server but do **not** commit the change).

3. `.gitignore` is configured to ignore other JSON files in this directory. Keep any additional secret material out of Git and manage it through your secret management process.

4. Reference the JSON file in docker-compose using the secrets configuration as usual.
