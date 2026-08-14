import os
from django.core.wsgi import get_wsgi_application

if os.environ.get('RENDER') or os.environ.get('DATABASE_URL'):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.production")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")

application = get_wsgi_application()

# Safe auto-migration and seeder on production startup
try:
    from django.core.management import call_command
    from django.contrib.auth import get_user_model
    from apps.inventory.models import MenuItem
    
    print("[WSGI Startup] Running Django migrations on production PostgreSQL...")
    call_command('migrate', interactive=False)
    
    if MenuItem.objects.count() == 0:
        print("[WSGI Startup] Operational data (MenuItems) is missing. Running seed_render_db...")
        call_command('seed_render_db')
        print("[WSGI Startup] Database migration from local dump completed.")
    else:
        print("[WSGI Startup] Database already contains operational data.")
except Exception as e:
    print(f"[WSGI Startup] Error during startup database migrations/seeding: {e}")

