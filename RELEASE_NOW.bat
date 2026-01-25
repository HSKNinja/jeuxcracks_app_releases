@echo off
set /p msg="Message de la mise a jour : "

echo.
echo ----------------------------------------
echo 1. Sauvegarde des changements...
git add .
git commit -m "chore: prepare release" 2>nul
echo ----------------------------------------

echo.
echo 2. Creation de la version (vX.X.X)...
call npm version patch -m "%msg%"
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERREUR lors de la creation de version !
    echo Verifie que tu n'as pas de fichiers modifies non stagés.
    pause
    exit /b
)

echo.
echo 3. Envoi vers GitHub (Push)...
git push origin main --tags
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERREUR lors de l'envoi vers GitHub !
    echo Verifie ta connexion ou tes droits d'acces.
    pause
    exit /b
)

echo.
echo ----------------------------------------
echo 🚀 SUCCES ! Mise a jour envoyee vers GitHub.
echo.
echo GitHub va maintenant :
echo  1. Construire l'installateur (Windows)
echo  2. Publier la release automatiquement
echo.
echo Lien pour suivre : https://github.com/Wasmata/jeuxcracks_app_releases/releases
echo ----------------------------------------
pause
