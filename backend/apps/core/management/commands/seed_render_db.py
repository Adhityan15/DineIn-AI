import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings

class Command(BaseCommand):
    help = "Migrate local database state (local_dump.json) to Render PostgreSQL."

    def handle(self, *args, **options):
        self.stdout.write("=================== RUNNING RENDER DB MIGRATION & SEEDING ===================")
        
        # 1. Run migrations first to make sure schema is up to date
        self.stdout.write("Running Django database migrations...")
        call_command('migrate', interactive=False)
        self.stdout.write("Migrations completed.")
        
        # 2. Path to local dump
        fixture_path = os.path.join(settings.BASE_DIR, 'local_dump.json')
        if not os.path.exists(fixture_path):
            fixture_path = os.path.join(settings.BASE_DIR, 'backend', 'local_dump.json')
            
        if os.path.exists(fixture_path):
            self.stdout.write(f"Found local dump at: {fixture_path}")
            
            # Flush existing database to prevent unique/duplicate key conflicts
            self.stdout.write("Flushing production database...")
            call_command('flush', interactive=False)
            self.stdout.write("Database flushed.")
            
            # Load local dump
            self.stdout.write("Loading local database dump...")
            call_command('loaddata', fixture_path, ignorenonexistent=True)
            self.stdout.write("Local database dump loaded successfully!")
            
            # Ensure admin1 has the correct branch (ADAMBAKKAM-CHENNAI)
            try:
                from django.contrib.auth import get_user_model
                from apps.core.models import Branch
                User = get_user_model()
                admin1 = User.objects.filter(username='admin1').first()
                target_branch = Branch.objects.filter(name='ADAMBAKKAM-CHENNAI').first() or Branch.objects.filter(id='c25e6dd3-b6e7-436e-99ed-13c0e965eb03').first()
                if admin1 and target_branch:
                    admin1.branch = target_branch
                    admin1.save()
                    self.stdout.write(f"SUCCESS: Updated admin1's branch to {target_branch.name} ({target_branch.id})")
                else:
                    self.stdout.write(f"WARNING: admin1={admin1}, target_branch={target_branch}. Branch update skipped.")
            except Exception as e:
                self.stdout.write(f"ERROR updating admin1 branch: {e}")
        else:
            self.stdout.write(self.style.WARNING("local_dump.json not found! Running fallback seeding..."))
            
        self.stdout.write("=================== MIGRATION COMPLETED ===================")
