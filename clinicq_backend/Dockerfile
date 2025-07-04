# clinicq_backend/Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app/backend

# Install system dependencies (like libpq-dev for psycopg2, if not using -binary)
# For psycopg2-binary, typically no extra system deps are needed for basic use.
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     libpq-dev \
#  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Also install Gunicorn for running the app
RUN pip install --no-cache-dir gunicorn

# Copy the rest of the backend application code
COPY . .

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port 8000 for Gunicorn
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
# Default CMD if not overridden by docker-compose
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "clinicq_backend.wsgi:application"]
