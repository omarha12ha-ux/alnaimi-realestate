@echo off
title AlNaimi Real Estate - LIVE ONLINE PREVIEW (keep open)
color 0B
cd /d "C:\Users\DELL\Desktop\alnaimi_realestate_source_code"

echo.
echo   ============================================================
echo     AlNaimi Real Estate  -  LIVE ONLINE PREVIEW
echo     Public address for the new site, with auto-restart.
echo     Keep this window open to keep the link alive.
echo   ============================================================
echo.

if not exist "dist\index.html" (
  echo   Building the production bundle...
  call npm run build
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\keep-alive.ps1"

echo.
echo   ------------------------------------------------------------
echo     Link saved to:  C:\Users\DELL\Desktop\ALNAIMI-LIVE-LINK.txt
echo     Keep this window OPEN. Closing it stops the public link.
echo   ------------------------------------------------------------
echo.
pause
