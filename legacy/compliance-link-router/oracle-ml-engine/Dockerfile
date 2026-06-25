FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install necessary build dependencies for ML libraries (DuckDB, Pandas, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port 3001 for the internal network
EXPOSE 3001

# Start the FastAPI application via uvicorn
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "3001"]
