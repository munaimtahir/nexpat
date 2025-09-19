# Deployment Guide

codex/create-deployment-documentation-for-django-and-react
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
=======
This document outlines how to deploy the ClinicQ application in a production or server environment. The project consists of a Django backend and a React frontend.

## Server Prerequisites

Install the following software on the host machine:

- **Python 3.12** and `pip`
- **Node.js 20** and `npm`
- **PostgreSQL 15**
- **Nginx** (to reverse proxy to Gunicorn and serve static files)
- Optionally **Docker** and **Docker Compose** if you prefer containerization

## Environment Variables

Create a `.env` file based on [`deploy/.env.example`](../deploy/.env.example) and adjust the values for your environment. Important variables include:

- `SECRET_KEY` – Django secret key
- `DEBUG` – set to `False` in production
- `ALLOWED_HOSTS` – comma-separated hostnames that can serve the app
- `DATABASE_URL` – PostgreSQL connection string
- `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` – optional initial superuser
- `CORS_ALLOWED_ORIGINS` – allowed origins if backend and frontend are on different hosts
- `VITE_API_BASE_URL` – Backend host used by the frontend build (omit `/api`; the helper appends it)

The backend parses `DATABASE_URL` using [`dj-database-url`](https://pypi.org/project/dj-database-url/). Providing an invalid URL
causes Django to raise an `ImproperlyConfigured` exception at startup.

## Running the Backend

### Development (manage.py runserver)
```bash
cd clinicq_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Production (Gunicorn)
```bash
cd clinicq_backend
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
gunicorn --bind 0.0.0.0:8000 clinicq_backend.wsgi:application
```
Serve Gunicorn behind Nginx using the provided [`deploy/clinicq.nginx`](../deploy/clinicq.nginx) and [`deploy/clinicq.service`](../deploy/clinicq.service) templates.

## Building and Serving the Frontend

```bash
cd clinicq_frontend
npm install
npm run build
```
The compiled files will be placed in `clinicq_frontend/dist`. Serve this directory with Nginx or any static file server.

## Docker Option

Container images are defined by the Dockerfiles in [`clinicq_backend/Dockerfile`](../clinicq_backend/Dockerfile) and [`clinicq_frontend/Dockerfile`](../clinicq_frontend/Dockerfile). A complete development stack can be launched with `docker-compose`:

```bash
docker-compose up --build -d
```
This starts PostgreSQL, the Django backend, and the React frontend. Customize the compose file for production deployments or build and run the images individually.
