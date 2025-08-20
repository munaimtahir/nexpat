# ClinicQ - Token Queue Management System

ClinicQ is a browser-based token queue system designed for clinics. It allows assistants to issue today-only tokens, provides a public queue display, and lets doctors mark patients as done.

This project is built with Django (backend API) and React (frontend).

The Django backend project resides in the `clinicq_backend/` directory; run management commands from there or via the `backend` Docker service.

## Features

### Release 2 - v0.2.0 (Current)

*   **Permanent Patient Records**:
    *   Patients (`registration_number`, `name`, `phone`, `gender`) are stored permanently.
    *   Search for patients by registration number, name fragment, or phone fragment via `GET /api/patients/search/?q=`.
    *   Full CRUD for patient records available via `/api/patients/`.
*   **Multi-Queue Support (up to 5 queues)**:
    *   Clinics can define multiple service queues (e.g., "General", "Specialist") via the Django admin interface (`Queue` model).
    *   Token numbers are generated per queue and reset daily for each queue independently.
    *   Assistants select a queue when issuing a token.
    *   Public display can show all queues (`/display`) or a specific queue (`/display?queue=<id>`).
*   **Quick Re-registration**:
    *   Assistants can quickly re-register returning patients by entering their registration number.
    *   Patient details are auto-filled in the form.
    *   A new token is generated and a new visit record is created without altering existing patient data.
*   **Previous Visit Glance**:
    *   Assistant and Doctor dashboards now show the last 5 visit dates for a selected patient, providing a quick medical history glance.
*   **Enhanced Visit Model**: The `Visit` model now links to `Patient` and `Queue` records.
*   **Data Back-fill**: Existing visit data from Release 1 is automatically migrated to use the new patient and queue structures (default "General" queue and "anonymous" patient records).

### Release 1 - v0.1.0

*   **Token Generation (Assistant)**: Input patient name and gender to generate a unique token for the day (single queue).
*   **Public Queue Display (`/display`)**: Shows all waiting tokens for the single queue, highlights the first in line, and auto-refreshes every 5 seconds.
*   **Doctor Dashboard (`/doctor`)**: Lists waiting tokens; allows doctors to mark patients as "Done", removing them from the active queue.
*   **Persistence**: Visit data (token, patient info, date, status) stored in a PostgreSQL database. Release 2 introduces `Patient` and `Queue` tables and links `Visit` to them.
*   **Admin Interface**: Django admin enabled for data management. In Release 2, this includes managing `Patient` and `Queue` records.

## API Endpoints

Key API endpoints include:

*   `POST /api/visits/`: Create a new visit (token). Requires `patient` (ID) and `queue` (ID).
*   `GET /api/visits/?status=WAITING[&queue=<id>]`: List waiting visits, optionally filtered by queue.
*   `PATCH /api/visits/<id>/done/`: Mark a visit as done.
*   `GET /api/patients/`: List patients or retrieve a specific patient by registration number (`/api/patients/<reg_no>/`).
*   `POST /api/patients/`: Create a new patient.
*   `PUT/PATCH /api/patients/<reg_no>/`: Update patient details.
*   `DELETE /api/patients/<reg_no>/`: Delete a patient.
*   `GET /api/patients/search/?q=<query>`: Search for patients.
*   `GET /api/queues/`: List available service queues.

## Technology Stack

*   **Backend**: Python 3.12, Django 5, Django REST Framework
*   **Frontend**: React 18, Vite, Tailwind CSS
*   **Database**: PostgreSQL 15
*   **Testing**:
    *   Backend: Pytest, pytest-django, coverage.py
    *   Frontend: Jest, React Testing Library, MSW, jest-axe
*   **CI/CD**: GitHub Actions
*   **Local Development**: Docker, Docker Compose

## Local Setup

Follow these steps to run ClinicQ locally for development and testing.

### Prerequisites

* [Docker](https://www.docker.com/get-started)
* [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://your-repo-url-here/clinicq.git  # Replace with actual repo URL
   cd clinicq
   ```
2. **Start the stack**
   ```bash
   docker-compose up --build -d
   ```
   This builds images for the backend, frontend and database, applies database migrations and creates a default Django superuser using the credentials defined in `docker-compose.yml`.
3. **Access the services**
   * **Frontend (Vite dev server)** – [http://localhost:5173](http://localhost:5173)
   * **Backend API** – [http://localhost:8000/api/](http://localhost:8000/api/)
   * **Django admin** – [http://localhost:8000/admin/](http://localhost:8000/admin/) (log in using the superuser credentials from step 2)

### Manual Setup (without Docker)

If you prefer running the stack without Docker, ensure PostgreSQL is running and then:

1. **Backend**
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r clinicq_backend/requirements.txt
   export DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db>
   cd clinicq_backend
   python manage.py migrate
   python manage.py runserver
   ```
2. **Frontend**
   ```bash
   cd ../clinicq_frontend
   npm install
   npm run dev
   ```
   The Vite dev server will be available at `http://localhost:5173`.

### Environment Variables

Default development values are provided via `docker-compose.yml`. Create a `.env` file or export variables in your shell to override them when running locally.

| Variable | Service | Description | Default |
| --- | --- | --- | --- |
| `POSTGRES_DB` | db | Name of development database | `clinicq_dev_db` |
| `POSTGRES_USER` | db | Database user | `clinicq_dev_user` |
| `POSTGRES_PASSWORD` | db | Database password | `clinicq_dev_password` |
| `SECRET_KEY` | backend | Django secret key | `django_insecure_local_dev_secret_key_!@#%^&*()` |
| `DEBUG` | backend | Enable Django debug mode | `True` |
| `DATABASE_URL` | backend | Postgres connection string | `postgresql://clinicq_dev_user:clinicq_dev_password@db:5432/clinicq_dev_db` |
| `DJANGO_SUPERUSER_USERNAME` | backend | Initial superuser username | `admin` |
| `DJANGO_SUPERUSER_EMAIL` | backend | Initial superuser email | `admin@example.com` |
| `DJANGO_SUPERUSER_PASSWORD` | backend | Initial superuser password | `adminpass` |
| `VITE_API_BASE_URL` | frontend | URL used by frontend to reach the API | `http://localhost:8000/api` |
| `CHOKIDAR_USEPOLLING` | frontend | Enables file-watching in some Docker setups | `true` |
| `WDS_SOCKET_PORT` | frontend | Port used for Vite's HMR websocket | `5173` |

### Creating Additional Admin Users

To create additional Django superusers after the initial setup:

```bash
docker-compose exec backend python manage.py createsuperuser
```

### Stopping the Application

Stop services with:

```bash
docker-compose down
```

Remove containers and volumes with:

```bash
docker-compose down -v
```

## Running Tests

### Backend Tests
Run the Django test suite using the built-in test runner:
```bash
cd clinicq_backend
python manage.py test
```

Alternatively, if you prefer `pytest` and have Docker running:
```bash
docker-compose exec backend pytest
```
Or locally with a configured Python environment:
```bash
cd clinicq_backend
# Ensure virtualenv is active and dependencies installed
pytest
```

### Frontend Tests
Run the React test suite with:
```bash
cd clinicq_frontend
npm test
```

If you are running inside Docker or want to disable watch mode:
```bash
docker-compose exec frontend npm test -- --watchAll=false
```

## Project Structure

```
.
├── clinicq_backend/       # Django backend application
│   ├── api/               # Django app for API logic
│   ├── clinicq_backend/   # Django project settings
│   ├── Dockerfile         # Dockerfile for backend
│   ├── entrypoint.sh      # Entrypoint script for backend Docker image
│   ├── manage.py
│   └── requirements.txt
├── clinicq_frontend/      # React frontend application
│   ├── public/
│   ├── src/
│   ├── Dockerfile         # Dockerfile for frontend
│   ├── jest.config.cjs    # Jest configuration
│   └── package.json
├── deploy/                # Deployment-related ops files
│   ├── .env.example
│   ├── build_frontend.sh
│   ├── clinicq.nginx
│   ├── clinicq.service
│   └── deploy_backend.sh
├── .github/               # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml
├── docker-compose.yml     # Docker Compose for local development
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE.md
└── README.md
```

## API Documentation

Detailed endpoint information is available in [docs/api.md](docs/api.md). Once the backend is running, the Django REST Framework browsable API is available at [http://localhost:8000/api/](http://localhost:8000/api/).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License – see [LICENSE.md](LICENSE.md) for details.
