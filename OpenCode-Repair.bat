@echo off
title OpenCode Repair

set "EXE=%APPDATA%\ai.opencode.desktop\cli\2.2.5-x64\opencode-cli.exe"

echo ==================================
echo       OPENCODE REPAIR TOOL
echo ==================================

if not exist "%EXE%" (
    echo ERREUR : moteur OpenCode introuvable.
    pause
    exit /b 1
)

echo.
echo Version du moteur :
"%EXE%" --version

echo.
echo Arret du service...
"%EXE%" service stop

echo.
echo Demarrage du service en mode diagnostic...
"%EXE%" serve --service --print-logs

pause