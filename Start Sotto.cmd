@echo off
setlocal
cd /d "%~dp0"
set "ELECTRON_RUN_AS_NODE="

rem Use the release matching this checkout, never a leftover unpacked build.
set "sottoVersion="
for /f "delims=" %%V in ('powershell.exe -NoLogo -NoProfile -NonInteractive -Command "(ConvertFrom-Json -InputObject (Get-Content -LiteralPath 'package.json' -Raw)).version"') do set "sottoVersion=%%V"
if defined sottoVersion (
  if exist "release\Sotto-%sottoVersion%-Windows.exe" (
    start "" "release\Sotto-%sottoVersion%-Windows.exe"
    if errorlevel 1 goto launchFailed
    exit /b 0
  )
  if exist "release\%sottoVersion%\Sotto-%sottoVersion%-Windows.exe" (
    start "" "release\%sottoVersion%\Sotto-%sottoVersion%-Windows.exe"
    if errorlevel 1 goto launchFailed
    exit /b 0
  )
)

rem Source checkouts can still run without a packaged release.
if not exist "node_modules\electron\dist\electron.exe" goto missingBuild
where npm.cmd >nul 2>nul
if errorlevel 1 goto missingBuild
call npm.cmd start
if errorlevel 1 goto launchFailed
exit /b 0

:missingBuild
echo Sotto could not find a release for this version or an installed development runtime.
echo Download the Windows executable, or run npm install in this folder and try again.
echo https://github.com/MEmio3/Sotto/releases
goto failed

:launchFailed
echo Sotto could not start. The error above may explain what went wrong.

:failed
pause
exit /b 1
