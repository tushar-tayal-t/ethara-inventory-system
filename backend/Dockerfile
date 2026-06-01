FROM python:3.11-slim

WORKDIR /workspace

# Install system dependencies (build-essential, libpq-dev for Postgres drivers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 8000

# Run using uvicorn reload in development or regular run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
