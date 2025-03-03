:: filepath: /E:/resources/cmdserver/start.bat
@echo off

:: Check if jq is installed
where /q jq
if %errorlevel% neq 0 (
  echo jq not found. Please install jq from https://stedolan.github.io/jq/download/ and ensure it is in your PATH.
  exit /b 1
)

:: Load configuration from config.json
set "CONFIG_FILE=%cd%\config.json"
if not exist "%CONFIG_FILE%" (
  echo Configuration file not found: %CONFIG_FILE%
  exit /b 1
)

for /f "delims=" %%i in ('jq -r ".backend.host" "%CONFIG_FILE%"') do set "HOST=%%i"
for /f "delims=" %%i in ('jq -r ".backend.port" "%CONFIG_FILE%"') do set "PORT=%%i"

:: Function to check if a command exists
where /q uvicorn
if %errorlevel% neq 0 (
  echo uvicorn not found, installing...
  pip install uvicorn
  set "PATH=%PATH%;%USERPROFILE%\AppData\Roaming\Python\Python39\Scripts"
)

:: Set the PYTHONPATH to the current directory
set "PYTHONPATH=%cd%\backend"

:: Start the FastAPI server in a new window
start cmd /k "set "PYTHONPATH=%cd%\backend" && uvicorn "app.app:app" --host %HOST% --port %PORT%"

:: Start the frontend development server
cd frontend
npm run dev