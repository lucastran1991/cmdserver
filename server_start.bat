@echo off
echo Starting deployment process...

if not exist frontend\ (
	echo Frontend directory not found
	exit /b 1
)

echo Deploying frontend...
cd frontend
pm2 stop nextjs-app 2>nul
if errorlevel 1 echo Previous frontend instance wasn't running
npm run build
if errorlevel 1 (
	echo Frontend build failed
	cd ..
	exit /b 1
)
pm2 start npm --name "nextjs-app" -- start
cd ..

if not exist backend\ (
	echo Backend directory not found
	exit /b 1
)

echo Deploying backend...
cd backend
pm2 stop fastapi-backend 2>nul
if errorlevel 1 echo Previous backend instance wasn't running
pm2 start "uvicorn app.app:app --host 0.0.0.0 --port 8000" --interpreter=python3 --name fastapi-backend
cd ..

echo Deployment completed successfully!
