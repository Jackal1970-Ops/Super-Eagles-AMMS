@echo off
setlocal
title Super Eagles AMMS Server

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
echo [4/6] Verifying SQLite database and seed records...
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

if not exist "prisma\dev.db" if exist "dev.db" copy /y "dev.db" "prisma\dev.db" >nul
if not exist "prisma\dev.db" (
    echo   - Database not found. Initializing schema and seeding dataset...
    call node ./node_modules/prisma/build/index.js db push
    if %errorlevel% neq 0 exit /b 1
    call node scripts/seed.mjs
    if %errorlevel% neq 0 exit /b 1
    echo   [OK] Database seeded successfully.
)
copy /y "prisma\dev.db" "dev.db" >nul
echo   [OK] Live Prisma database present; root recovery snapshot refreshed.
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
echo   DEVELOPER MASTER ADMIN LOGIN (ACCESS ALL FEATURES):
echo   - Email:     admin@supereagles.co.za
echo   - Password:  AdminPass2026!
echo ===============================================================================
echo.

REM Open browser automatically in background
start http://localhost:3000

REM Ensure port 3000 is clean and available
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul

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
