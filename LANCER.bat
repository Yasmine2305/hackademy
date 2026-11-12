@echo off
REM ============================================================
REM  HACKADEMY - lancement en un double-clic (Windows)
REM  1. installe les dependances (premiere fois seulement)
REM  2. compile le site React (premiere fois seulement)
REM  3. demarre le serveur et ouvre http://localhost:3001
REM ============================================================
cd /d "%~dp0"
title Hackademy
if "%PORT%"=="" set PORT=3001

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js n'est pas installe. Telechargez la version LTS sur https://nodejs.org
  echo  puis relancez ce fichier.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
  echo.
  echo  [1/3] Installation des dependances, environ 1 minute...
  if exist "node_modules" rmdir /s /q "node_modules"
  call npm install --no-audit --no-fund
  if errorlevel 1 ( echo  Echec de npm install. & pause & exit /b 1 )
)

if not exist "client\dist\index.html" (
  echo.
  echo  [2/3] Compilation du site...
  call npm run build
  if errorlevel 1 ( echo  Echec de la compilation. & pause & exit /b 1 )
)

echo.
echo  [3/3] Demarrage. Le navigateur va s'ouvrir sur http://localhost:%PORT%
echo  Laissez cette fenetre ouverte. Pour arreter : Ctrl + C
if not defined HACKADEMY_NO_BROWSER start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:%PORT%"
call npm start
pause
