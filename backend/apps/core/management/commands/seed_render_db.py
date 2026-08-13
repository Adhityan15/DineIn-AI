import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds Render production PostgreSQL database reliably and idempotently with complete operational dataset and admin1 user."

    def handle(self, *args, **options):
        self.stdout.write("=================== SEEDING RENDER PRODUCTION DATABASE ===================")
        
        # 1. Ensure migrations are applied
        self.stdout.write("Running Django migrations...")
        call_command('migrate', interactive=False)
        self.stdout.write(self.style.SUCCESS("[OK] Migrations completed."))

        # 2. Seed roles and permissions
        self.stdout.write("Seeding roles and permissions...")
        try:
            call_command('seed_roles_permissions')
            self.stdout.write(self.style.SUCCESS("[OK] Roles & permissions seeded."))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Role seeding note: {e}"))

        # 3. Seed operational Chennai data if missing or sparse
        from apps.core.models import Branch
        from apps.inventory.models import MenuItem
        from apps.reservation.models import Table

        branch_count = Branch.objects.count()
        menu_count = MenuItem.objects.count()
        table_count = Table.objects.count()

        self.stdout.write(f"Current DB Stats: Branches={branch_count}, MenuItems={menu_count}, Tables={table_count}")

        if branch_count == 0 or menu_count < 5 or table_count < 5:
            self.stdout.write("Database lacks operational data. Running seed_chennai_data...")
            try:
                call_command('seed_chennai_data')
                self.stdout.write(self.style.SUCCESS("[OK] seed_chennai_data executed successfully."))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error executing seed_chennai_data: {e}"))
        else:
            self.stdout.write(self.style.SUCCESS("[OK] Operational dataset already present."))

        # 4. Ensure admin1 user exists and is properly configured
        self._ensure_admin1_user()

        self.stdout.write(self.style.SUCCESS("=================== RENDER SEEDING COMPLETED 100% ==================="))

    def _ensure_admin1_user(self):
        from apps.authentication.models import Role
        from apps.core.models import Branch

        admin_role = Role.objects.filter(code='admin').first() or Role.objects.filter(code='manager').first()
        branch = Branch.objects.filter(branch_code='adambakkam-chennai').first() or Branch.objects.filter(name__icontains='Chennai').first() or Branch.objects.first()

        admin1 = User.objects.filter(username='admin1').first()
        if not admin1:
            admin1 = User.objects.filter(email='adhityanmclaren@gmail.com').first()

        if not admin1:
            self.stdout.write("Creating admin1 user...")
            admin1 = User.objects.create_user(
                username='admin1',
                email='adhityanmclaren@gmail.com',
                password='Admin@123',
                first_name='Admin',
                last_name='User',
                role=admin_role,
                branch=branch,
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS("[OK] Created admin1 user."))
        else:
            self.stdout.write("Verifying admin1 user attributes...")
            admin1.username = 'admin1'
            if admin_role:
                admin1.role = admin_role
            if branch:
                admin1.branch = branch
            admin1.is_staff = True
            admin1.is_superuser = True
            admin1.is_active = True
            admin1.set_password('Admin@123')
            admin1.save()
            self.stdout.write(self.style.SUCCESS(f"[OK] Verified admin1 user (Role: {admin1.role}, Branch: {admin1.branch})."))

