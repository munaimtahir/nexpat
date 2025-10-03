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
  ```bash
  docker-compose up
  ```

- **`docker-compose.prod.yml`** - Production configuration
  ```bash
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
  ```

## Usage

### Local Development

From the repository root:
```bash
cd infra
docker-compose up
```

This starts:
- PostgreSQL database (port 54320)
- Django backend (port 8000)
- React frontend (port 5173)

### Production Deployment

See `docs/ops/DEPLOYMENT_GUIDE.md` for complete production deployment instructions.

### Secrets Management

1. Copy example files:
   ```bash
   cp secrets/gdrive_service_account.json.example secrets/gdrive_service.json
   ```

2. Fill in actual credentials (never commit these!)

3. Reference in docker-compose using secrets configuration
