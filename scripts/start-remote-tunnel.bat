@echo off
title Super Eagles AMMS - Nationwide Remote Mobile Access Launcher
echo =====================================================================
echo    SUPER EAGLES ATHLETICS MANAGEMENT SYSTEM (AMMS)
echo    NATIONWIDE MOBILE ACCESS LAUNCHER (Cloudflare Secure Tunnel)
echo =====================================================================
echo.
echo Launching automated secure tunnel...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-remote-tunnel.ps1"
pause
