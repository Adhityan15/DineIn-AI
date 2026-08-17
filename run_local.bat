@echo off
title DineIn-AI Local Backend Dev Server
echo ===================================================
echo   Starting DineIn-AI Local Backend Dev Server
echo   Using virtual environment: backend\.venv
echo ===================================================
cd backend
.venv\Scripts\python manage.py runserver
pause
