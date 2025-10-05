@echo off
echo Stopping Personalized Healthcare Multi-Agent System...
echo.

REM Stop and remove containers
docker-compose down

echo.
echo Containers stopped successfully!
pause