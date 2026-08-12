import os
import django
import sys

sys.path.append(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.notifications.models import NotificationChannelSettings
settings_list = NotificationChannelSettings.objects.all()
for idx, s in enumerate(settings_list):
    dec = s.get_decrypted_password()
    print(f"Decrypted Password: '{dec}'")
