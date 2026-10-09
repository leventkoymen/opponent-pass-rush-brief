@echo off
cd /d "%~dp0"
node scripts\serve.mjs
if errorlevel 1 pause
