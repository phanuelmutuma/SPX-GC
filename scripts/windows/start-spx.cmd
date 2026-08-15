@echo off
REM SPX Graphics Controller — Windows helper
REM Double-click SPX.exe in this folder; this script is optional.
cd /d "%~dp0"
if exist "SPX.exe" (
  start "SPX Graphics Controller" "SPX.exe"
) else (
  echo SPX.exe not found. Run this script from the Windows build folder.
  pause
)
