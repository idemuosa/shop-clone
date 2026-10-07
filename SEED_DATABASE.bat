@echo off
echo ==========================================
echo Seeding Vivi Shop Database via Express API...
echo ==========================================

curl -X POST http://localhost:3000/api/seed

echo.
echo ==========================================
echo Seeding Request Sent!
echo ==========================================
pause
