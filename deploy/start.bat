@echo off
echo Starting Personalized Healthcare Multi-Agent System...
echo.

REM Check if .env file exists
if not exist "..\.env" (
    echo Warning: .env file not found!
    echo Please copy env.example to .env and add your GROQ_API_KEY
    echo.
)

REM Start the containers
docker-compose up --build

pause