import os
import django
import sys
sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")
django.setup()

from django.urls import get_resolver
resolver = get_resolver()

for key, val in resolver.reverse_dict.items():
    if isinstance(key, str):
        print(f"URL Name: {key} -> {val}")
