@echo off
echo ========================================
echo    iMessage App Setup Checker
echo ========================================
echo.

echo [1/6] Checking Backend...
if exist "backend\package.json" (
    echo ✅ Backend found
) else (
    echo ❌ Backend not found
)

echo [2/6] Checking Frontend...
if exist "frontend\package.json" (
    echo ✅ Frontend found
) else (
    echo ❌ Frontend not found
)

echo [3/6] Checking Backend .env...
if exist "backend\.env" (
    echo ✅ Backend .env found
) else (
    echo ❌ Backend .env NOT FOUND - Copy .env.example to .env!
)

echo [4/6] Checking Frontend .env...
if exist "frontend\.env" (
    echo ✅ Frontend .env found
) else (
    echo ❌ Frontend .env NOT FOUND - Copy .env.example to .env!
)

echo [5/6] Checking Contact Routes...
if exist "backend\src\routes\contact.route.js" (
    echo ✅ Contact routes installed
) else (
    echo ❌ Contact routes missing
)

echo [6/6] Checking Contact Components...
if exist "frontend\src\components\chat\AddContactModal.jsx" (
    echo ✅ Contact UI components installed
) else (
    echo ❌ Contact components missing
)

echo.
echo ========================================
echo    Setup Check Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Install dependencies: npm install (in both backend and frontend)
echo 2. Start backend: start-backend.bat
echo 3. Start frontend: start-frontend.bat
echo 4. Open: http://localhost:5173
echo.
pause
