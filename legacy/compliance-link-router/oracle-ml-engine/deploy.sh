#!/bin/bash
set -e

echo "Deploying Aegis Route Oracle ARM64 ML Engine..."

# Ensure we are in the directory containing this script
cd "$(dirname "$0")"

# Check if .env file exists, otherwise warn about API_KEY
if [ ! -f .env ] && [ -z "$API_KEY" ]; then
    echo "WARNING: .env file not found and API_KEY environment variable is not set."
    echo "Make sure to configure the API_KEY for authentication."
fi

# Build and deploy the Docker container in detached mode
echo "Building and starting Docker container..."
docker compose up -d --build

echo "Deployment completed successfully! ML Engine running on port 3001."
