@echo off
echo ==========================================
echo Seeding Vivo Shop Database...
echo ==========================================
cd backend

if exist venv\Scripts\python.exe (
    echo Running seed script via virtual environment...
    venv\Scripts\python.exe seed_data.py
) else (
    echo [ERROR] Virtual environment not found. Please run FIX_BACKEND.bat first.
    pause
    exit /b
)

echo.
echo ==========================================
echo Seeding Complete!
echo ==========================================
pause
