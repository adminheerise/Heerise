@echo off
REM Double-click to open the Lumina test-user admin dashboard in your browser.
set "URL=https://www.heeriseacademy.com/lumina-sim-admin/"
if /I "%~1"=="local" set "URL=http://localhost:1313/lumina-sim-admin/"
start "" "%URL%"
exit /b 0
