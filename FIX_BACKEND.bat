@echo off
setlocal enabledelayedexpansion
echo ==========================================
echo Fixing Vivi Backend Requirements...
echo ==========================================
cd backend

:: Try to find Python
set PYTHON_CMD=python
where python >nul 2>nul
if %errorlevel% neq 0 (
    set PYTHON_CMD=py
    where py >nul 2>nul
    if !errorlevel! neq 0 (
        echo [ERROR] Python not found in system PATH.
        echo Please install Python from https://python.org and check "Add to PATH"
        pause
        exit /b
    )
)

if exist venv\Scripts\python.exe (
    echo Using existing virtual environment...
    venv\Scripts\python.exe -m pip install -r requirements.txt
) else (
    echo Virtual environment not found. Creating one with !PYTHON_CMD!...
    !PYTHON_CMD! -m venv venv
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b
    )
    echo Installing requirements...
    venv\Scripts\python.exe -m pip install -r requirements.txt
)

if !errorlevel! neq 0 (
    echo [ERROR] Failed to install requirements.
    pause
    exit /b
)

echo.
echo ==========================================
echo Backend fixed successfully!
echo You can now run RUN_SHOP.bat
echo ==========================================
pause
