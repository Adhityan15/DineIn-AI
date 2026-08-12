import os
import django
import sys

sys.path.append(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.notifications.models import NotificationChannelSettings
settings_list = NotificationChannelSettings.objects.all()
print(f"Total settings count: {settings_list.count()}")
for idx, s in enumerate(settings_list):
    print(f"[{idx}] Host: {s.smtp_host}, Username: {s.smtp_username}, Port: {s.smtp_port}, TLS: {s.smtp_use_tls}, SSL: {s.smtp_use_ssl}")
    dec = s.get_decrypted_password()
    print(f"    Password: {dec[:3]}... (len={len(dec) if dec else 0})")
