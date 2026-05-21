@echo off
echo Starting Vivi Shop - Hybrid Architecture...

:: Check if backend venv exists, if not, warn user
if not exist backend\venv\Scripts\python.exe (
    echo [WARNING] Backend virtual environment not found.
    echo Please run FIX_BACKEND.bat first.
    pause
    exit /b
)

:: Start Backend in a new window
start "Vivi Backend" cmd /c "cd backend && venv\Scripts\python.exe run.py"

:: Start Frontend in current window
echo Starting Frontend...
npm run dev
pause
