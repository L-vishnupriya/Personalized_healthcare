@echo off
echo Resetting Personalized Healthcare Multi-Agent System...
echo.

REM Stop and remove containers, networks, and volumes
docker-compose down -v

REM Remove images
docker-compose down --rmi all

echo.
echo System reset complete! All containers, images, and data have been removed.
pause