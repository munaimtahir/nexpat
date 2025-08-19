# Deployment Guide

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
- `ALLOWED_HOSTS` – comma‑separated hostnames that can serve the app
- `DATABASE_URL` – PostgreSQL connection string
- `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` – optional initial superuser
- `CORS_ALLOWED_ORIGINS` – allowed origins if backend and frontend are on different hosts
- `VITE_API_BASE_URL` – API base URL used by the frontend build

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

