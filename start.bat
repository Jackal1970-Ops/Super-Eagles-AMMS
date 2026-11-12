@echo off
setlocal
title Super Eagles AMMS Server

REM Keep the live SQLite database on the host PC, never on a mapped/UNC share.
REM Phones and other workstations connect through HTTP; they do not open the DB file.
if not defined LOCALAPPDATA set "LOCALAPPDATA=%USERPROFILE%\AppData\Local"
set "AMMS_DATA_DIR=%LOCALAPPDATA%\SuperEaglesAMMS"
set "AMMS_DB_PATH=%AMMS_DATA_DIR%\dev.db"
if not exist "%AMMS_DATA_DIR%" mkdir "%AMMS_DATA_DIR%"
set "AMMS_DB_URL_PATH=%AMMS_DB_PATH:\=/%"
set "DATABASE_URL=file:%AMMS_DB_URL_PATH%"

cls
echo ===============================================================================
echo   SUPER EAGLES ATHLETICS AND MEMBERSHIP MANAGEMENT SYSTEM (AMMS)
echo   Official Athletics, Walking, Sponsorship and Membership Platform
echo ===============================================================================
echo.

REM --- Step 1: Optional Python Environment ---
echo [1/6] Checking optional Python analytics environment...
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo   - Python detected in PATH.
    echo   [OK] Optional analytics scripts are available. Dependencies are not downloaded during normal startup.
) else (
    echo   [NOTE] Python not found in system PATH. Core app runs via Node.js.
)
echo.

REM --- Step 2: Node.js Verification ---
echo [2/6] Verifying Node.js runtime environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required but was not found in your system PATH!
    echo Please download and install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo   [OK] Node.js %NODE_VERSION% active.
echo.

REM --- Step 3: Node.js Package Installation ---
echo [3/6] Checking Node.js packages...
if not exist "node_modules\" (
    echo   - node_modules not found. Running npm install, please wait...
    call npm ci --no-audit
    if %errorlevel% neq 0 (
        echo [ERROR] npm ci failed. Please check the lockfile and internet connection.
        echo.
        pause
        exit /b 1
    )
    echo   [OK] Node.js packages installed successfully.
) else (
    echo   [OK] Node.js packages already installed.
)
echo.

REM --- Step 4: Database and Prisma Verification ---
echo [4/6] Verifying local SQLite database and seed records...
if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul
        echo   [OK] Generated .env configuration from template.
    )
)
echo   - Generating Prisma client library...
call node ./node_modules/prisma/build/index.js generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma client generation failed.
    pause
    exit /b 1
)

if not exist "%AMMS_DB_PATH%" if exist "prisma\dev.db" copy /y "prisma\dev.db" "%AMMS_DB_PATH%" >nul
if not exist "%AMMS_DB_PATH%" if exist "dev.db" copy /y "dev.db" "%AMMS_DB_PATH%" >nul
if not exist "%AMMS_DB_PATH%" (
    echo   - Database not found. Initializing schema and seeding dataset...
    call node ./node_modules/prisma/build/index.js db push
    if %errorlevel% neq 0 exit /b 1
    call node scripts/seed.mjs
    if %errorlevel% neq 0 exit /b 1
    echo   [OK] Database seeded successfully.
)
copy /y "%AMMS_DB_PATH%" "%AMMS_DATA_DIR%\startup_snapshot.db" >nul
echo   [OK] Live database: %AMMS_DB_PATH%
echo   [OK] Local startup recovery snapshot refreshed.
echo.

REM --- Step 5: Next.js Production Build Verification ---
echo [5/6] Checking Next.js production build...
if not exist ".next\BUILD_ID" (
    echo   - Production build not found. Compiling application...
    call node ./node_modules/next/dist/bin/next build
    if %errorlevel% neq 0 (
        echo [ERROR] Next.js build failed.
        echo.
        pause
        exit /b 1
    )
    echo   [OK] Production build completed.
) else (
    echo   [OK] Production build ready.
)
echo.

REM --- Step 6: Launch Server and Browser ---
echo [6/6] Launching Super Eagles AMMS Server...
echo.
set LOCAL_IP=localhost
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress"') do set LOCAL_IP=%%a

echo ===============================================================================
echo   ACCESS URLS FOR ALL DEVICES:
echo.
echo   - Local Computer (This PC):
echo     http://localhost:3000
echo.
echo   - Clubhouse Wi-Fi / LAN (Athletes and Coaches on Phones/Tablets):
echo     http://%LOCAL_IP%:3000
echo ===============================================================================
echo.
echo   IMPORTANT: Allow TCP port 3000 through Windows Firewall for private networks
echo   if phones cannot connect. Do not expose port 3000 directly to the internet.
echo.

REM Refuse to kill an unrelated service that already owns the configured port.
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 1 }"
if %errorlevel% neq 0 (
    echo [ERROR] TCP port 3000 is already in use. Stop the existing service or configure another port.
    pause
    exit /b 1
)

REM Open the local browser after giving the server a moment to bind.
start "" /b cmd /c "timeout /t 2 /nobreak ^>nul ^& start http://localhost:3000"

REM Run Next.js server bound to 0.0.0.0 on port 3000
if "%1"=="dev" (
    echo Starting in DEVELOPMENT mode...
    node ./node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 3000
) else (
    echo Starting in OPTIMIZED PRODUCTION mode on 0.0.0.0:3000 ...
    node ./node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
)

echo.
echo Server has stopped.
pause
