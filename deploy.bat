@echo off
echo ==========================================
echo      AliManager Deployment Script
echo ==========================================

echo.
echo [1/3] Building React Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Exiting.
    exit /b %errorlevel%
)

echo.
echo [2/3] Deploying Frontend to Firebase Hosting...
call cmd /c "firebase deploy --only hosting"

echo.
echo [3/3] Deployment Request Complete.
echo.
echo NOTE: Ensure your Backend is already running on Cloud Run!
echo This script only updates the Frontend assets.
pause
