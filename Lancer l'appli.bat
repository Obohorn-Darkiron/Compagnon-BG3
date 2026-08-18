@echo off
title Compagnon BG3 - ne pas fermer cette fenetre
cd /d "%~dp0"
echo Demarrage du serveur...
start "Compagnon BG3 - serveur" cmd /k npm run dev
timeout /t 6 /nobreak >nul
start "" http://localhost:5173
echo.
echo L'appli devrait s'ouvrir dans ton navigateur.
echo Laisse la fenetre "Compagnon BG3 - serveur" ouverte tant que tu utilises l'appli.
echo Tu peux fermer cette fenetre-ci.
pause
