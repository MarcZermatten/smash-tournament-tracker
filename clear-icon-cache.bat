@echo off
echo Nettoyage du cache d'icones Windows...
taskkill /F /IM explorer.exe
timeout /T 2 /NOBREAK > nul
del /A /Q "%localappdata%\IconCache.db"
del /A /F /Q "%localappdata%\Microsoft\Windows\Explorer\iconcache*"
echo Cache nettoye!
echo Redemarrage de l'explorateur...
start explorer.exe
echo Termine! Reinstallez maintenant l'application.
pause
