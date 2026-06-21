@echo off
cls
color 0A
echo ===============================================
echo    WHATSAPP-LIKE MESSAGING APP
echo    Quick Start Script
echo ===============================================
echo.
echo This will start BOTH backend and frontend
echo.
echo OPTION 1: Start Backend Only
echo OPTION 2: Start Frontend Only
echo OPTION 3: Check Configuration
echo OPTION 4: Open Test Instructions
echo OPTION 5: Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto check
if "%choice%"=="4" goto instructions
if "%choice%"=="5" goto end

:backend
echo.
echo Starting Backend Server...
echo.
cd backend
start cmd /k "npm run dev"
echo.
echo ✅ Backend terminal opened!
echo Wait for "MongoDB Connected" message
echo.
pause
goto menu

:frontend
echo.
echo Starting Frontend App...
echo.
cd frontend
start cmd /k "npm run dev"
echo.
echo ✅ Frontend terminal opened!
echo Wait for "Local: http://localhost:5173"
echo Then open: http://localhost:5173
echo.
pause
goto menu

:check
echo.
echo Checking Configuration...
echo.
call check-setup.bat
pause
goto menu

:instructions
echo.
echo Opening Test Instructions...
echo.
start notepad FINAL_SETUP_AND_TEST.txt
goto menu

:menu
echo.
echo ===============================================
echo What would you like to do next?
echo ===============================================
echo.
echo 1. Start Backend
echo 2. Start Frontend
echo 3. Check Configuration
echo 4. View Test Instructions
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "
goto choice

:end
echo.
echo Thank you for using iMessage!
echo.
pause
exit
