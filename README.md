# ClinicQ - Token Queue Management System

ClinicQ is a browser-based token queue system designed for clinics. It allows assistants to issue today-only tokens, provides a public queue display, and lets doctors mark patients as done.

This project is built with Django (backend API) and React (frontend).

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

## Getting Started (Local Development)

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### One-Command Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://your-repo-url-here/clinicq.git # Replace with actual repo URL
    cd clinicq
    ```

2.  **Environment Variables for Backend:**
    The `docker-compose.yml` file sets default development environment variables for Django, including database connection details and superuser credentials. You typically don't need a separate `.env` file for `docker-compose up` for the backend service due to these defaults. If you need to override them, you can create a `.env` file in the `clinicq_backend` directory, and Docker Compose might pick it up (behavior can vary). The `entrypoint.sh` script will use `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, and `DJANGO_SUPERUSER_PASSWORD` from the environment to create an initial superuser.

3.  **Environment Variables for Frontend (Optional):**
    The frontend uses `VITE_API_BASE_URL` which is pre-configured in `docker-compose.yml` to point to the backend service (`http://localhost:8000/api`). If you need other frontend-specific environment variables, create a `.env` file in the `clinicq_frontend` directory. See Vite's documentation on [Env Variables and Modes](https://vitejs.dev/guide/env-and-mode.html).

4.  **Run Docker Compose:**
    Navigate to the project root directory (where `docker-compose.yml` is located) and run:
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Forces Docker to rebuild the images if there are changes in Dockerfiles or application code.
    *   `-d`: Runs containers in detached mode (in the background).

    This command will:
    *   Build the Docker images for the backend and frontend services if they don't exist or if changes are detected.
    *   Start containers for the PostgreSQL database, Django backend, and React frontend.
    *   The backend service will automatically apply database migrations.
    *   A default admin superuser is auto-created using the environment variables defined in `docker-compose.yml` for the `backend` service (e.g., `DJANGO_SUPERUSER_USERNAME=admin`, `DJANGO_SUPERUSER_EMAIL=admin@example.com`, `DJANGO_SUPERUSER_PASSWORD=adminpass`).

5.  **Accessing the Application:**
    *   **Frontend (Main Application)**: [http://localhost:5173](http://localhost:5173) (Vite dev server)
    *   **Backend API**: [http://localhost:8000/api/](http://localhost:8000/api/)
    *   **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)
        *   Log in with the superuser credentials (e.g., `admin` / `adminpass` or as defined in `docker-compose.yml`). From here, you can manage `Visit` records and create initial user accounts for doctors if needed (though user authentication for doctors beyond Django admin is not part of v0.1.0).

### Creating Additional Admin Users

If you need to create additional Django superusers after the initial setup:
```bash
docker-compose exec backend python manage.py createsuperuser
```
Follow the prompts to set the username, email, and password.

### Stopping the Application

To stop the Docker Compose services:
```bash
docker-compose down
```
To stop and remove volumes (like the database data):
```bash
docker-compose down -v
```

## Running Tests

### Backend Tests

Ensure Docker Compose services are running (or at least the `db` service if tests connect to it, though backend tests here use `APITestCase` which often sets up its own test DB).
To run backend tests directly within the container:
```bash
docker-compose exec backend pytest
```
Or, if your local Python environment is set up similarly to the Docker image and you have a local PostgreSQL instance or can configure tests to use SQLite:
```bash
cd clinicq_backend
# Ensure virtualenv is active and dependencies installed
# Set necessary environment variables (like DATABASE_URL if not using test DB settings)
pytest
```

### Frontend Tests

Frontend tests are currently configured but may face execution issues in some sandboxed environments. To run them:
```bash
docker-compose exec frontend npm test -- --watchAll=false
```
Or locally:
```bash
cd clinicq_frontend
npm install # If not already done
npm test -- --watchAll=false
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
└── README.md
```

## Contributing

Please read `CONTRIBUTING.md` (to be created) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the `LICENSE.md` (to be created) file for details.
```
