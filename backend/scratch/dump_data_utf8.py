import os
import django
import sys

sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.core import serializers
from django.apps import apps

# Models to exclude (to avoid foreign key/duplicate issues on clean DB)
excluded_models = [
    'contenttypes.contenttype',
    'auth.permission',
    'auth.group',
    'admin.logentry',
    'sessions.session',
]

objects = []
for model in apps.get_models():
    opts = model._meta
    model_name = f"{opts.app_label}.{opts.model_name}"
    if model_name in excluded_models:
        print(f"Excluding model: {model_name}")
        continue
    
    # Fetch all objects
    qs = model.objects.all()
    count = qs.count()
    if count > 0:
        print(f"Adding model {model_name}: {count} records")
        for obj in qs:
            objects.append(obj)

print(f"\nSerializing total of {len(objects)} objects...")
with open('datadump.json', 'w', encoding='utf-8') as f:
    serializers.serialize(
        'json', 
        objects, 
        indent=4, 
        stream=f, 
        use_natural_foreign_keys=True, 
        use_natural_primary_keys=True
    )
print("Data serialization to datadump.json completed successfully in UTF-8!")
