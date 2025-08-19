# Deployment Guide

This guide outlines how to deploy the ClinicQ project in a traditional server environment or using containers.

## Server prerequisites

* **Python**: 3.12
* **Node.js**: 20 (for building the React frontend)
* **PostgreSQL**: 15
* **Nginx** (optional but recommended for serving static files and acting as a reverse proxy)
* **Virtualenv** or similar tool for isolating Python packages

## Environment variables

Create a `.env` file (an example is provided at `deploy/.env.example`) with values for:

* `SECRET_KEY` – Django secret key
* `DEBUG` – set to `False` in production
* `ALLOWED_HOSTS` – comma‑separated list of allowed hostnames
* `DATABASE_URL` – connection string for PostgreSQL
* Optional superuser variables: `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD`
* Any additional settings used by the project (e.g. `CORS_ALLOWED_ORIGINS`)

For the frontend, configure `VITE_API_BASE_URL` so the compiled React app knows how to reach the backend API.

## Launching the backend

Activate your virtual environment and install dependencies:

```bash
pip install -r clinicq_backend/requirements.txt
```

Run Django using the development server:

```bash
cd clinicq_backend
python manage.py runserver 0.0.0.0:8000
```

For a production server, use Gunicorn:

```bash
gunicorn --bind 0.0.0.0:8000 clinicq_backend.wsgi:application
```

## Building and serving the frontend

Install Node dependencies and create the production build:

```bash
cd clinicq_frontend
npm ci
npm run build
```

The build artifacts are placed in `clinicq_frontend/dist`. Serve this directory using Nginx or any static file server.

## Using Docker

The repository contains Dockerfiles for the backend and frontend as well as a `docker-compose.yml` for local development.

* Build and run everything with Docker Compose:
  ```bash
  docker-compose up --build -d
  ```
* To build standalone images, use the Dockerfiles under `clinicq_backend/` and `clinicq_frontend/`, then run the containers with your preferred orchestration tool.

These containers expect the same environment variables described above. Update `docker-compose.yml` or pass them at runtime as needed.

