@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Super Eagles AMMS - Remote Athlete Access Gateway

cls
echo ===============================================================================
echo   🦅 SUPER EAGLES AMMS - REMOTE ATHLETE ACCESS GATEWAY
echo   Encrypted Public Tunnel for Athletes ^& Coaches Away from Clubhouse
echo ===============================================================================
echo.

where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTICE] Cloudflare Tunnel (cloudflared) is not currently in system PATH.
    echo.
    echo To allow athletes anywhere in South Africa to log in from their phones:
    echo 1. Download the free single-file binary: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    echo 2. Place it in this folder as cloudflared.exe
    echo 3. Run this script again!
    echo.
    echo Meanwhile, athletes connected to clubhouse Wi-Fi can access:
    echo http://172.25.8.121:3000
    echo.
    pause
    exit /b 0
)

echo Starting local server and encrypted Cloudflare tunnel...
start "Super Eagles AMMS Server" cmd /k "call start.bat"
timeout /t 5 /nobreak >nul
echo.
echo Tunnel active! Distribute the generated https://*.trycloudflare.com link to your athletes.
cloudflared tunnel --url http://localhost:3000
pause
