@echo off
title = Fix security rules
cd /d "C:\Users\DELL\Desktop\alnaimi_realestate_source_code"
echo This restores the secure Firestore rules. Nothing else is changed.
echo.
node scripts\safeguard.cjs --repair
echo.
echo -------------------------------------------------
echo Close this window when you are finished.
pause
