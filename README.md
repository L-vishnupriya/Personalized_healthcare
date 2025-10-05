# Personalized Healthcare Multi-Agent Demo

A comprehensive full-stack implementation featuring a multi-agent healthcare system with real-time AI coordination, powered by **Agno**, **GROQ**, and **CopilotKit**.

## Architecture Overview

This demo showcases a sophisticated healthcare application with:

- **7 Specialized AI Agents** working in coordination
- **Real-time Multi-Agent Communication** via Agno framework
- **High-Speed LLM Processing** using GROQ's Mixtral model
- **Interactive Chat Interface** powered by CopilotKit
- **Synthetic Healthcare Database** with 100 user profiles
- **Docker-based Deployment** for easy setup

## Multi-Agent System

### Core Agents:
1. **GreetingAgent** - Personal user validation and welcome
2. **MoodTrackerAgent** - Captures and logs user mood data
3. **CGMAgent** - Monitors continuous glucose readings (80-300 mg/dL range)
4. **FoodIntakeAgent** - Records meals and estimates macronutrients
5. **MealPlannerAgent** - Generates adaptive 3-meal plans
6. **InterruptAgent** - Handles general Q&A and routing
7. **HealthcareCoordinator** - Central orchestrator for all agents

### Key Features:
- **Real-time Agent Coordination** with intelligent routing
- **Database Integration** with SQLite for persistent data
- **Health Data Monitoring** with CGM and mood tracking
- **Personalized Meal Planning** based on medical conditions
- **Interactive Dashboard** with charts and visualizations

## Quick Start

### Prerequisites
- Docker and Docker Compose
- GROQ API Key ([Get one here](https://console.groq.com/keys))

### Setup Steps

1. **Clone and Navigate**
   ```bash
   cd ppp
   ```

2. **Configure Environment**
   ```bash
   cp deploy/env.example .env
   # Edit .env and add your GROQ_API_KEY
   ```

3. **Deploy with Docker**
   ```bash
   cd deploy
   docker-compose up --build
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Start the System**
   ```bash
   cd deploy
   docker-compose up --build
   ```

2. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

3. **Stop the System**
   ```bash
   docker-compose down
   ```

### Using Helper Scripts

**Windows:**
```bash
cd deploy
start.bat    # Start the system
stop.bat     # Stop the system
reset.bat    # Reset everything (removes all data)
```

**Linux/Mac:**
```bash
cd deploy
./start.sh   # Start the system
./stop.sh    # Stop the system
./reset.sh   # Reset everything (removes all data)
```

### Docker Services

- **Backend Service**: Python FastAPI server with multi-agent system
- **Frontend Service**: Next.js application with responsive UI
- **Shared Network**: `healthcare_network` for service communication
- **Persistent Data**: SQLite database stored in `../data` volume

## Usage Examples

### Starting a Session
```
User: "My ID is 42"
Agent: "Hello! I've validated your profile. Welcome back, [Name]!"
```

### Logging Health Data
```
User: "My glucose reading is 120"
Agent: "Glucose reading 120 mg/dL is stable. Data logged successfully."

User: "I'm feeling tired today"
Agent: "Mood 'tired' logged for user 42."
```

### Meal Planning
```
User: "I had a chicken salad for lunch"
Agent: "Meal 'chicken salad' logged successfully. Estimated macros: Carbs: 15g, Protein: 25g, Fat: 12g."

User: "Generate a meal plan for today"
Agent: "Here's your personalized 3-meal plan based on your Type 2 Diabetes and current mood..."
```

## Project Structure

```
ppp/
├── agents/                 # Python backend with multi-agent system
│   ├── database.py        # SQLite database and synthetic data generation
│   ├── tools.py           # Agent tools for health data operations
│   ├── agents_config.py   # Agent definitions and coordination
│   ├── run_server.py      # FastAPI server with multi-agent endpoint
│   ├── requirements.txt   # Python dependencies
│   └── users.db          # SQLite database (auto-generated)
├── frontend/              # Next.js frontend with responsive UI
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   └── components/   # React components (Dashboard)
│   ├── package.json      # Node.js dependencies
│   └── [config files]    # Next.js, Tailwind, TypeScript configs
├── deploy/                # Docker deployment files
│   ├── Dockerfile.backend # Backend container configuration
│   ├── Dockerfile.frontend # Frontend container configuration
│   ├── docker-compose.yml # Multi-service orchestration
│   ├── env.example       # Environment variables template
│   ├── start.bat/.sh     # Windows/Linux start scripts
│   ├── stop.bat/.sh      # Windows/Linux stop scripts
│   └── reset.bat/.sh     # Windows/Linux reset scripts
└── README.md             # This file
```

## Technical Stack

### Backend
- **Agno Framework** - Multi-agent orchestration
- **GROQ API** - High-speed LLM inference
- **FastAPI** - Modern Python web framework
- **SQLite** - Lightweight database
- **Faker** - Synthetic data generation

### Frontend
- **Next.js 14** - React framework with app router
- **CopilotKit** - AI chat interface
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **TypeScript** - Type-safe development

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **AG-UI Protocol** - Agent communication bridge

## Key Features Demonstrated

1. **Multi-Agent Coordination** - Agents work together seamlessly
2. **Real-time Communication** - Instant responses via GROQ
3. **Health Data Management** - CGM, mood, and meal tracking
4. **Personalized Recommendations** - Adaptive meal planning
5. **Interactive Dashboard** - Visual data representation
6. **Scalable Architecture** - Docker-based deployment

## Agent Communication Flow

```
User Input → CopilotKit → Next.js API → AG-UI Bridge → FastAPI
     ↓
HealthcareCoordinator → Route to Specialized Agent → Execute Tools
     ↓
Database Operations → LLM Processing → Response Generation
     ↓
Real-time Streaming → Frontend Dashboard → User Interface
```

## Development

### Local Development
```bash
# Backend
cd agents
pip install -r requirements.txt
python run_server.py

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables
- `GROQ_API_KEY` - Required for LLM processing
- `NEXT_PUBLIC_AGENT_URL` - Backend service URL
- `NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL` - Frontend API route

## Database Schema

### Users Table
- `user_id` (Primary Key)
- `first_name`, `last_name`
- `city`, `dietary_preference`
- `medical_conditions`, `physical_limitations`

### Logs Table
- `log_id` (Primary Key)
- `user_id` (Foreign Key)
- `timestamp`, `log_type`, `value`

## Production Considerations

- Replace SQLite with PostgreSQL for production
- Add authentication and user management
- Implement proper error handling and logging
- Add health checks and monitoring
- Configure SSL/TLS for secure communication
- Set up CI/CD pipelines for automated deployment

