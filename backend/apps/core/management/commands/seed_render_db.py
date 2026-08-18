import os
import sys
import traceback
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
from django.db.models.signals import pre_save, post_save, pre_delete, post_delete, m2m_changed

class MuteSignals(object):
    def __init__(self, *signals):
        self.signals = signals
        self.paused = {}

    def __enter__(self):
        for signal in self.signals:
            self.paused[signal] = signal.receivers
            signal.receivers = []

    def __exit__(self, exc_type, exc_val, exc_tb):
        for signal in self.signals:
            signal.receivers = self.paused[signal]

class Command(BaseCommand):
    help = "Migrate local database state (local_dump.json) to Render PostgreSQL."

    def handle(self, *args, **options):
        log_file_path = os.path.join(settings.BASE_DIR, 'migration.log')
        with open(log_file_path, 'w', encoding='utf-8') as log_file:
            def log(msg):
                self.stdout.write(msg)
                log_file.write(msg + '\n')
                log_file.flush()

            log("=================== RUNNING RENDER DB MIGRATION & SEEDING ===================")
            
            try:
                # 1. Run migrations first
                log("Running Django database migrations...")
                call_command('migrate', interactive=False, stdout=log_file, stderr=log_file)
                log("Migrations completed.")
                
                # 2. Path to local dump
                fixture_path = os.path.join(settings.BASE_DIR, 'local_dump.json')
                if not os.path.exists(fixture_path):
                    fixture_path = os.path.join(settings.BASE_DIR, 'backend', 'local_dump.json')
                    
                if os.path.exists(fixture_path):
                    log(f"Found local dump at: {fixture_path}")
                    
                    # Flush existing database
                    log("Flushing production database...")
                    call_command('flush', interactive=False, stdout=log_file, stderr=log_file)
                    log("Database flushed.")
                    
                    # Load local dump with muted signals to prevent constraint and cascade issues during import
                    log("Loading local database dump with muted signals...")
                    with MuteSignals(pre_save, post_save, pre_delete, post_delete, m2m_changed):
                        call_command('loaddata', fixture_path, ignorenonexistent=True, stdout=log_file, stderr=log_file)
                    log("Local database dump loaded successfully!")
                    
                    # Ensure admin1 and adhityan have the correct branch (ADAMBAKKAM-CHENNAI)
                    try:
                        from django.contrib.auth import get_user_model
                        from apps.core.models import Branch
                        User = get_user_model()
                        target_branch = Branch.objects.filter(name='ADAMBAKKAM-CHENNAI').first() or Branch.objects.filter(id='c25e6dd3-b6e7-436e-99ed-13c0e965eb03').first()
                        if target_branch:
                            admin1 = User.objects.filter(username='admin1').first()
                            if admin1:
                                admin1.branch = target_branch
                                admin1.save()
                                log(f"SUCCESS: Updated admin1's branch to {target_branch.name}")
                            adhityan = User.objects.filter(username='adhityan').first()
                            if adhityan:
                                adhityan.branch = target_branch
                                adhityan.save()
                                log(f"SUCCESS: Updated adhityan's branch to {target_branch.name}")
                        else:
                            log(f"WARNING: Target branch not found. Branch update skipped.")
                    except Exception as e:
                        log(f"ERROR updating admin/adhityan branch: {e}")
                else:
                    log("WARNING: local_dump.json not found! Seeding skipped.")
            except Exception as e:
                log(f"CRITICAL ERROR during migration: {e}")
                log("Traceback:")
                log(traceback.format_exc())
                
            log("=================== MIGRATION COMPLETED ===================")
