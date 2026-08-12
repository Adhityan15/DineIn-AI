import os
import django
import sys
sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")
django.setup()

from django.urls import get_resolver
resolver = get_resolver()

def show_patterns(patterns, prefix=""):
    for p in patterns:
        if hasattr(p, 'url_patterns'):
            show_patterns(p.url_patterns, prefix + str(p.pattern))
        else:
            print(f"{prefix}{p.pattern} -> {p.name}")

show_patterns(resolver.url_patterns)
