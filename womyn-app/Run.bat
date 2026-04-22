@echo off
TITLE Womyn Project w1905050 Fridali Gaias
echo =======================================
echo   WOMYN PROJECT: DEV ENVIRONMENT
echo =======================================
node -v >nul 2>&1
IF NOT EXIST "node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
) ELSE (
    echo [1/2] Dependencies already present.
)
echo [2/2] Starting Parcel server...
echo.
echo NOTE: Use Invite Code: 2026w1905050
echo.
start "" "http://localhost:1234"
call npm start
pause