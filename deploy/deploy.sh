#!/bin/bash

echo "🚀 Deploying Personalized Healthcare Multi-Agent System..."

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your GROQ_API_KEY"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start new containers
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
curl -f http://localhost:8000/health || echo "❌ Backend not ready"
curl -f http://localhost:3000 || echo "❌ Frontend not ready"

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
