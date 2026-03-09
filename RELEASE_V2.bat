@echo off
setlocal enabledelayedexpansion

:: --- CONFIGURATION ---
set "VERSION_V2=2.0.0"
set "REPO_RELEASES=https://github.com/Wasmata/jeuxcracks_app_releases/releases"

:: --- COLORS (ANSI ESCAPE CODES) ---
set "ESC="
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "MAGENTA=%ESC%[95m"
set "CYAN=%ESC%[96m"
set "WHITE=%ESC%[97m"
set "GRAY=%ESC%[90m"
set "BOLD=%ESC%[1m"
set "RESET=%ESC%[0m"

cls
echo %BLUE%================================================================%RESET%
echo %BOLD%%CYAN%       🚀 JEUXCRACKS LAUNCHER - RELEASE TOOL V%VERSION_V2% %RESET%
echo %BLUE%================================================================%RESET%
echo.

:: --- STEP 0: BRANCH CHECK ---
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%i"
echo %WHITE%Branche actuelle : %BOLD%%MAGENTA%%BRANCH%%RESET%
if not "%BRANCH%"=="main" if not "%BRANCH%"=="master" (
    echo %YELLOW%[!] Attention : Vous n'etes pas sur la branche 'main'.%RESET%
)
echo.

:: --- STEP 1: SELECT RELEASE TYPE ---
echo %WHITE%Choisissez le type de version :%RESET%
echo  %CYAN%[1]%RESET% Patch (v1.x.%BOLD%X%RESET%) - Corrections mineures
echo  %CYAN%[2]%RESET% Minor (v1.%BOLD%X%RESET%.0) - Nouvelles fonctionnalités
echo  %CYAN%[3]%RESET% Major (%BOLD%X%RESET%.0.0) - Changements majeurs
echo.
set /p "choice=Choix [1-3] : "

set "VTYPE=patch"
if "%choice%"=="1" set "VTYPE=patch"
if "%choice%"=="2" set "VTYPE=minor"
if "%choice%"=="3" set "VTYPE=major"

echo.
set /p "msg=%BOLD%%WHITE%Message de la mise a jour : %RESET%"

echo.
echo %BLUE%----------------------------------------------------------------%RESET%
echo %YELLOW%Preparation du push...%RESET%
echo %BLUE%----------------------------------------------------------------%RESET%

:: --- STEP 2: GIT ADD & COMMIT ---
echo %WHITE%[1/4] %GRAY%Sauvegarde des changements...%RESET%
git add .
git commit -m "chore: pre-release cleanup - %msg%" 2>nul
if %errorlevel% neq 0 (
    echo %GRAY%[i] Rien a sauvegarder de nouveau.%RESET%
)

:: --- STEP 3: NPM VERSION ---
echo %WHITE%[2/4] %GRAY%Creation de la version (%VTYPE%)...%RESET%
call npm version %VTYPE% -m "Release: %VTYPE% - %msg%"
if %errorlevel% neq 0 (
    echo %RED%[X] Erreur : 'npm version' a echoue.%RESET%
    goto :error
)

:: --- STEP 4: GIT PUSH ---
echo %WHITE%[3/4] %GRAY%Envoi vers GitHub (Tags inclus)...%RESET%
git push origin %BRANCH% --tags
if %errorlevel% neq 0 (
    echo %RED%[X] Erreur : Push echoue.%RESET%
    goto :error
)

:: --- STEP 5: SUCCESS ---
echo.
echo %GREEN%[SUCCESS] %BOLD%La mise a jour a ete envoyee avec succes !%RESET%
echo.
echo %CYAN%Suivi de la release : %RESET%%WHITE%%REPO_RELEASES%%RESET%
echo %GRAY%(Attendez quelques minutes que les Actions GitHub se terminent)%RESET%
echo.
echo %BLUE%================================================================%RESET%
pause
exit /b 0

:error
echo.
echo %RED%================================================================%RESET%
echo %RED%   ⚠️  UNE ERREUR EST SURVENUE. OPERATION ANNULEE.      %RESET%
echo %RED%================================================================%RESET%
pause
exit /b 1
