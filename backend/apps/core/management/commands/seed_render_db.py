import os
import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds Render production PostgreSQL database with exported local data and ensures admin1 user."

    def handle(self, *args, **options):
        self.stdout.write("=================== SEEDING RENDER PRODUCTION DATABASE ===================")
        
        # 1. Run migrations
        self.stdout.write("Running Django migrations...")
        call_command('migrate', interactive=False)
        self.stdout.write(self.style.SUCCESS("[OK] Migrations completed."))

        # 2. Check for production fixture
        fixture_path = os.path.join(settings.BASE_DIR, 'production_data.json')
        if not os.path.exists(fixture_path):
            fixture_path = os.path.join(settings.BASE_DIR, 'backend', 'production_data.json')

        if os.path.exists(fixture_path):
            self.stdout.write(f"Found production fixture at: {fixture_path}")
            try:
                self.stdout.write("Loading production data fixture...")
                call_command('loaddata', fixture_path, ignorenonexistent=True)
                self.stdout.write(self.style.SUCCESS("[OK] Loaded production_data.json successfully!"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Standard loaddata encountered warning: {e}"))
                self.stdout.write("Running model-by-model idempotent fallback importer...")
                self._load_fixture_fallback(fixture_path)
        else:
            self.stdout.write(self.style.WARNING("production_data.json not found, running seed commands..."))
            call_command('seed_roles_permissions')
            call_command('seed_chennai_data')

        # 3. Ensure admin1 user exists and is properly configured
        self._ensure_admin1_user()

        self.stdout.write(self.style.SUCCESS("=================== RENDER SEEDING COMPLETED 100% ==================="))

    def _load_fixture_fallback(self, fixture_path):
        from django.apps import apps
        with open(fixture_path, 'r', encoding='utf-8') as f:
            objects = json.load(f)
            
        self.stdout.write(f"Total objects in fixture: {len(objects)}")
        loaded = 0
        skipped = 0
        
        for item in objects:
            model_label = item.get('model')
            pk = item.get('pk')
            fields = item.get('fields', {})
            
            if model_label in ['contenttypes.contenttype', 'auth.permission', 'sessions.session']:
                skipped += 1
                continue
                
            try:
                model_class = apps.get_model(model_label)
                obj, created = model_class.objects.get_or_create(pk=pk, defaults=fields)
                if not created:
                    for k, v in fields.items():
                        setattr(obj, k, v)
                    obj.save()
                loaded += 1
            except Exception as ex:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(f"Fallback import finish: {loaded} loaded, {skipped} skipped."))

    def _ensure_admin1_user(self):
        from apps.authentication.models import Role
        from apps.core.models import Branch

        admin1 = User.objects.filter(username='admin1').first()
        admin_role = Role.objects.filter(code='admin').first() or Role.objects.filter(code='manager').first()
        branch = Branch.objects.filter(id='c25e6dd3-b6e7-436e-99ed-13c0e965eb03').first() or Branch.objects.first()

        if not admin1:
            self.stdout.write("Creating admin1 user...")
            admin1 = User.objects.create_user(
                username='admin1',
                email='adhityanmclaren@gmail.com',
                password='Admin@123',
                first_name='Admin',
                last_name='User',
                role=admin_role,
                branch=branch
            )
            self.stdout.write(self.style.SUCCESS("[OK] Created admin1 user."))
        else:
            self.stdout.write("Verifying admin1 user attributes...")
            if admin_role and admin1.role != admin_role:
                admin1.role = admin_role
            if branch and admin1.branch != branch:
                admin1.branch = branch
            if not admin1.check_password('Admin@123'):
                admin1.set_password('Admin@123')
            admin1.save()
            self.stdout.write(self.style.SUCCESS(f"[OK] Verified admin1 user (Role: {admin1.role}, Branch: {admin1.branch})."))
