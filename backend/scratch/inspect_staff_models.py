import os
import sys
sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.testing")
django.setup()

import apps.staff.models
import inspect
for name, obj in inspect.getmembers(apps.staff.models):
    if inspect.isclass(obj) and hasattr(obj, "_meta"):
        print(f"Class: {name}")
        for field in obj._meta.get_fields():
            print(f"  Field: {field.name}")
