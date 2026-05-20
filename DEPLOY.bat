@echo off
echo ==========================================
echo Deploying Vivo Shop to Firebase...
echo ==========================================

:: 1. Check for Firebase CLI
where firebase >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Firebase CLI not found.
    echo Please run: npm install -g firebase-tools
    pause
    exit /b
)

:: 2. Build the project
echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b
)

:: 3. Login if needed (optional check)
echo Checking Firebase authentication...
call firebase login

:: 4. Deploy
echo Deploying to Firebase Hosting...
call firebase deploy --only hosting

echo.
echo ==========================================
echo Deployment Complete!
echo Your site should be live at: https://shopsy-ea9e4.web.app
echo ==========================================
pause
