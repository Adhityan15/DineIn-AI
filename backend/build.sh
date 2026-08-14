#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=================== RENDER DEPLOYMENT BUILD SCRIPT ==================="
if [ -f "backend/requirements.txt" ]; then
    cd backend
fi

echo "1. Installing requirements..."
pip install -r requirements.txt

echo "2. Collecting static files..."
python manage.py collectstatic --no-input --settings=dinein_project.settings.production

echo "3. Build step completed. Migrations & Seeding will run in the Render Release phase."
echo "=================== BUILD COMPLETED ==================="

