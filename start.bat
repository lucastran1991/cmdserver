:: filepath: /E:/resources/cmdserver/start.bat
@echo off

:: Load configuration from config.json
set CONFIG_FILE=%cd%\config.json
if not exist "%CONFIG_FILE%" (
  echo Configuration file not found: %CONFIG_FILE%
  exit /b 1
)

for /f "tokens=*" %%i in ('jq -r ".host" %CONFIG_FILE%') do set HOST=%%i
for /f "tokens=*" %%i in ('jq -r ".port" %CONFIG_FILE%') do set PORT=%%i

:: Function to check if a command exists
where /q uvicorn
if %errorlevel% neq 0 (
  echo uvicorn not found, installing...
  pip install uvicorn
  set PATH=%PATH%;%USERPROFILE%\AppData\Roaming\Python\Python39\Scripts
)

:: Set the PYTHONPATH to the current directory
set PYTHONPATH=%cd%\backend

:: Start the FastAPI server
uvicorn app.main:app --host %HOST% --port %PORT%