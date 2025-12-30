@echo off
cd /d D:\Project\DATN

start /b cmd /c "cd backend\app\recommend\server && uvicorn main:app --reload --port 3005 "
timeout /t 1 >nul

start /b cmd /c "cd backend\app\course\check_nsfw && uvicorn main:app --reload --port 3007 "
timeout /t 1 >nul


start /b cmd /c "cd backend\app\RAG && uvicorn app:app --reload --port 3006 "
timeout /t 1 >nul

start /b cmd /c "cd backend\app\course && npm run start:prod"
timeout /t 1 >nul


start /b cmd /c "cd backend\app\order_payment && npm run start:prod"
timeout /t 1 >nul


start /b cmd /c "cd backend\app\enrollment && npm run start:prod"
timeout /t 1 >nul

start /b cmd /c "cd backend\app\users && npm run start:prod"
timeout /t 1 >nul

start /b cmd /c "cd backend\app\storage_video\app && npm run start:prod"
timeout /t 1 >nul

start /b cmd /c "cd backend\app\recommend && npm run start:prod"
timeout /t 1 >nul


start /b cmd /c "cd fontend\fontend && npm run dev"
timeout /t 1 >nul


 


pause
