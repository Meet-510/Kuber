@echo off
setlocal enabledelayedexpansion
title Kuber — Startup

echo.
echo  ██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗
echo  ██║ ██╔╝██║   ██║██╔══██╗██╔════╝██╔══██╗
echo  █████╔╝ ██║   ██║██████╔╝█████╗  ██████╔╝
echo  ██╔═██╗ ██║   ██║██╔══██╗██╔══╝  ██╔══██╗
echo  ██║  ██╗╚██████╔╝██████╔╝███████╗██║  ██║
echo  ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
echo.
echo  Digital Banking Platform — Automated Startup
echo  ═══════════════════════════════════════════════
echo.

:: ── 1. Node.js check / auto-install ─────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [INFO] Node.js not found. Installing via winget...
    winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] winget install failed. Please install Node.js manually:
        echo          https://nodejs.org/en/download
        pause
        exit /b 1
    )
    echo  [OK] Node.js installed. Refreshing PATH...
    :: Refresh PATH for current session
    for /f "tokens=*" %%p in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"Machine\")"') do set "PATH=%%p;%PATH%"
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo  [WARN] Node.js installed but PATH not yet updated.
        echo         Please CLOSE this window and run start.bat again.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

:: ── 2. npm check ─────────────────────────────────────────────────────────────
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm not found even though Node.js is installed. Reinstall Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo  [OK] npm v%NPM_VER%

:: ── 3. MongoDB check ─────────────────────────────────────────────────────────
echo.
echo  Checking MongoDB...
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    sc start MongoDB >nul 2>&1
    echo  [OK] MongoDB service started
) else (
    mongod --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo  [OK] mongod found in PATH
    ) else (
        echo  [WARN] MongoDB not detected.
        echo.
        set /p INSTALL_MONGO=" Install MongoDB Community via winget now? [Y/N]: "
        if /i "!INSTALL_MONGO!"=="Y" (
            echo  Installing MongoDB...
            winget install --id MongoDB.Server --accept-source-agreements --accept-package-agreements
            echo  [OK] MongoDB installed. Starting service...
            sc start MongoDB >nul 2>&1
        ) else (
            echo  [WARN] Skipping MongoDB install.
            echo         The app will fail to connect. Install MongoDB from:
            echo         https://www.mongodb.com/try/download/community
            echo         Or use MongoDB Atlas and update MONGODB_URI in backend\.env
        )
    )
)

:: ── 4. Run setup wizard ───────────────────────────────────────────────────────
echo.
echo  ───────────────────────────────────────────────────────────
echo  Running setup wizard (first time: installs all packages)
echo  ───────────────────────────────────────────────────────────
node setup.js
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Setup failed. See messages above.
    pause
    exit /b 1
)

:: ── 5. Install root concurrently ─────────────────────────────────────────────
echo.
echo  Installing root runner...
call npm install --silent 2>nul
if %errorlevel% neq 0 (
    :: Try without silent flag for error output
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] Root npm install failed.
        pause
        exit /b 1
    )
)
echo  [OK] Concurrently installed

:: ── 6. Launch both servers ───────────────────────────────────────────────────
echo.
echo  ═══════════════════════════════════════════════════════════
echo.
echo   Backend  API  →  http://localhost:4000/graphql
echo   Frontend App  →  http://localhost:5173
echo.
echo   Opening browser in 5 seconds...
echo   Press Ctrl+C to stop both servers.
echo.
echo  ═══════════════════════════════════════════════════════════
echo.

:: Open browser after a short delay
start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:5173"

:: Run both servers with concurrently
call npx concurrently ^
    --names " BACKEND , FRONTEND" ^
    --prefix-colors "magenta.bold,cyan.bold" ^
    --prefix "[{name}]" ^
    --timestamp-format "HH:mm:ss" ^
    --kill-others-on-fail ^
    "npm run dev --prefix Backend" ^
    "npm run dev --prefix Frontend"

echo.
echo  Servers stopped.
pause
