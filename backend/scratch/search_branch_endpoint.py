import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.urls import resolve
from rest_framework.test import APIClient

client = APIClient()
response = client.get('/core/branches/')
print("Status Code without auth:", response.status_code)
try:
    print("Response Data:", response.json() if hasattr(response, 'json') else response.content)
except Exception as e:
    print("Error parsing json:", e)
