@echo off
title Sync Super Eagles AMMS to OneDrive
echo =====================================================================
echo   SUPER EAGLES ATHLETICS MANAGEMENT SYSTEM (AMMS)
echo   SYNC TO ONEDRIVE CLOUD STORAGE
echo =====================================================================
echo.
set "SRC=%~dp0.."
set "DEST=%USERPROFILE%\OneDrive - Gijima\Projects\Super Eagles Athletics Management System"

echo Source:      %SRC%
echo Destination: %DEST%
echo.
echo Syncing files (excluding node_modules and .next)...
robocopy "%SRC%" "%DEST%" /E /XD node_modules .next .git .gemini /R:1 /W:1

echo.
echo =====================================================================
echo Sync complete! Your files are now synchronized with OneDrive.
echo =====================================================================
pause
