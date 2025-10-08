@echo off
echo.
echo 🐍 Starting Speedy Snake Showdown Server...
echo.

cd /d "%~dp0server"

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Server starting on http://localhost:3000
echo Open multiple browser tabs to this address to play!
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js