import os
from django.core.wsgi import get_wsgi_application

if os.environ.get('RENDER') or os.environ.get('DATABASE_URL'):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.production")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")

application = get_wsgi_application()

# Safe one-time auto-seeder on production startup
try:
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if not User.objects.filter(username='admin1').exists():
        from django.core.management import call_command
        print("[WSGI Startup] admin1 user missing from PostgreSQL. Running automated Render database seeder...")
        call_command('seed_render_db')
        print("[WSGI Startup] Automated Render database seeder completed.")
except Exception as e:
    print(f"[WSGI Startup] Seeder check note: {e}")

