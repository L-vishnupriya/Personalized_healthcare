#!/bin/bash

echo "Starting Personalized Healthcare Multi-Agent System..."
echo

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "Warning: .env file not found!"
    echo "Please copy env.example to .env and add your GROQ_API_KEY"
    echo
fi

# Start the containers
docker-compose up --build