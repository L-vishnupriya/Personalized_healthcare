# Railway deployment - Backend only
FROM python:3.11-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache gcc musl-dev

# Copy backend files
COPY ./agents /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create data directory
RUN mkdir -p /app/data

# Expose port (Railway will set PORT environment variable)
EXPOSE 8000

# Start the backend server
CMD ["python", "run_server.py"]
