@echo off
cd /d "%~dp0"
if exist "release\win-unpacked\Sotto.exe" (
  start "" "release\win-unpacked\Sotto.exe"
) else (
  call npm start
)
