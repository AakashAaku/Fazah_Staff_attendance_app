@echo off
echo ==============================================
echo   FAZAH AUTO GARAGE - Production Startup Script
echo ==============================================
echo.

echo [1/3] Building Kiosk Frontend...
cd apps\kiosk
call npm run build
if %errorlevel% neq 0 (
  echo Error building Kiosk frontend.
  pause
  exit /b %errorlevel%
)
cd ..\..
echo Kiosk Frontend built successfully!
echo.

echo [2/3] Building Backend API...
cd apps\api
call npm run build
if %errorlevel% neq 0 (
  echo Error building Backend API.
  pause
  exit /b %errorlevel%
)
cd ..\..
echo Backend API built successfully!
echo.

echo =======================================================
echo  FAZAH GARAGE APP IS NOW LIVE ON YOUR LOCAL NETWORK!
echo =======================================================
echo.
echo  Local PC Access:   http://localhost:3000
echo.
echo  Garage Wi-Fi / Tablet / Mobile Access:
echo  - Kiosk Attendance: http://YOUR_PC_IP:3000/
echo  - Staff Portal:     http://YOUR_PC_IP:3000/portal
echo  - Admin Console:    http://YOUR_PC_IP:3000/admin
echo.
echo  (Find YOUR_PC_IP by running 'ipconfig' in command prompt)
echo =======================================================
echo.

cd apps\api
node dist/main.js

pause
