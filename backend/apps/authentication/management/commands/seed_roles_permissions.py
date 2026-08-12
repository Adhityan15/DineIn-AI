from django.core.management.base import BaseCommand
from django.db import transaction
from apps.authentication.models import Role, Permission
from apps.core.constants import (
    PERM_RESERVATION_VIEW, PERM_RESERVATION_CREATE, PERM_RESERVATION_EDIT, PERM_RESERVATION_DELETE,
    PERM_INVENTORY_VIEW, PERM_INVENTORY_CREATE, PERM_INVENTORY_EDIT, PERM_INVENTORY_DELETE,
    PERM_STAFF_VIEW, PERM_STAFF_EDIT,
    PERM_FEEDBACK_VIEW,
    PERM_ANALYTICS_VIEW,
    PERM_REPORTS_VIEW
)

class Command(BaseCommand):
    help = 'Idempotent command to seed default restaurant roles and permissions into database.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding for roles and permissions...")

        # 1. Define all permissions
        permissions_data = [
            # Reservation permissions
            {'code': PERM_RESERVATION_VIEW, 'name': 'View Reservations', 'desc': 'Can view reservation listings and calendars'},
            {'code': PERM_RESERVATION_CREATE, 'name': 'Create Reservation', 'desc': 'Can book new reservations'},
            {'code': PERM_RESERVATION_EDIT, 'name': 'Edit Reservation', 'desc': 'Can modify existing reservations'},
            {'code': PERM_RESERVATION_DELETE, 'name': 'Delete Reservation', 'desc': 'Can cancel or delete reservations'},
            
            # Inventory permissions
            {'code': PERM_INVENTORY_VIEW, 'name': 'View Inventory', 'desc': 'Can view inventory stock levels'},
            {'code': PERM_INVENTORY_CREATE, 'name': 'Create Inventory Item', 'desc': 'Can add new ingredients and batches'},
            {'code': PERM_INVENTORY_EDIT, 'name': 'Edit Inventory', 'desc': 'Can adjust stock levels and log consumption/wastage'},
            {'code': PERM_INVENTORY_DELETE, 'name': 'Delete Inventory Item', 'desc': 'Can remove inventory items and vendors'},
            
            # Staff permissions
            {'code': PERM_STAFF_VIEW, 'name': 'View Staff Records', 'desc': 'Can view staff details, shifts, and attendance logs'},
            {'code': PERM_STAFF_EDIT, 'name': 'Edit Staff/Shifts', 'desc': 'Can schedule shifts, register staff, and approve leaves'},
            
            # Analytics and Feedback permissions
            {'code': PERM_FEEDBACK_VIEW, 'name': 'View Customer Feedback', 'desc': 'Can view customer reviews and sentiment score analytics'},
            {'code': PERM_ANALYTICS_VIEW, 'name': 'View Sales Analytics', 'desc': 'Can access sales charts and menu performance dashboards'},
            {'code': PERM_REPORTS_VIEW, 'name': 'View Weekly Reports', 'desc': 'Can download weekly/monthly performance summary reports'},
        ]

        # Ingest permissions idempotently
        permission_objects = {}
        for perm in permissions_data:
            obj, created = Permission.objects.get_or_create(
                code=perm['code'],
                defaults={'name': perm['name'], 'description': perm['desc']}
            )
            permission_objects[perm['code']] = obj
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created permission: {perm['code']}"))
            else:
                # Update existing permissions metadata
                obj.name = perm['name']
                obj.description = perm['desc']
                obj.save()

        # 2. Define Roles and assign permissions
        roles_data = [
            {
                'code': 'admin',
                'name': 'Administrator',
                'desc': 'System Administrator with full access rights',
                'perms': list(permission_objects.values())
            },
            {
                'code': 'owner',
                'name': 'Restaurant Owner',
                'desc': 'Restaurant Franchise/Location Owner with full access rights',
                'perms': list(permission_objects.values())
            },
            {
                'code': 'manager',
                'name': 'Restaurant Manager',
                'desc': 'Daily Operations Restaurant Manager',
                'perms': [
                    permission_objects[PERM_RESERVATION_VIEW],
                    permission_objects[PERM_RESERVATION_CREATE],
                    permission_objects[PERM_RESERVATION_EDIT],
                    permission_objects[PERM_RESERVATION_DELETE],
                    permission_objects[PERM_INVENTORY_VIEW],
                    permission_objects[PERM_INVENTORY_EDIT],
                    permission_objects[PERM_STAFF_VIEW],
                    permission_objects[PERM_FEEDBACK_VIEW],
                    permission_objects[PERM_ANALYTICS_VIEW],
                    permission_objects[PERM_REPORTS_VIEW]
                ]
            },
            {
                'code': 'receptionist',
                'name': 'Receptionist',
                'desc': 'Service Staff managing table seatings and bookings',
                'perms': [
                    permission_objects[PERM_RESERVATION_VIEW],
                    permission_objects[PERM_RESERVATION_CREATE],
                    permission_objects[PERM_RESERVATION_EDIT]
                ]
            },
            {
                'code': 'inventory_manager',
                'name': 'Inventory Manager',
                'desc': 'Staff managing stock levels, purchases, and vendors',
                'perms': [
                    permission_objects[PERM_INVENTORY_VIEW],
                    permission_objects[PERM_INVENTORY_CREATE],
                    permission_objects[PERM_INVENTORY_EDIT],
                    permission_objects[PERM_INVENTORY_DELETE]
                ]
            },
            {
                'code': 'kitchen_staff',
                'name': 'Kitchen Staff',
                'desc': 'Kitchen personnel tracking ingredient consumption and wastage',
                'perms': [
                    permission_objects[PERM_INVENTORY_VIEW],
                    permission_objects[PERM_INVENTORY_EDIT]
                ]
            },
            {
                'code': 'customer',
                'name': 'Customer',
                'desc': 'DineIn Customer viewing table availability and booking',
                'perms': [
                    permission_objects[PERM_RESERVATION_VIEW],
                    permission_objects[PERM_RESERVATION_CREATE],
                    permission_objects[PERM_RESERVATION_EDIT]
                ]
            }
        ]

        # Ingest roles and assign permissions idempotently
        for role_info in roles_data:
            role, created = Role.objects.get_or_create(
                code=role_info['code'],
                defaults={'name': role_info['name'], 'description': role_info['desc']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role: {role_info['code']}"))
            else:
                role.name = role_info['name']
                role.description = role_info['desc']
                role.save()

            # Set associated permissions
            role.permissions.set(role_info['perms'])
            self.stdout.write(f"Updated permissions for role: {role.code}")

        # Seed default department and designations
        from apps.staff.models import Department, Designation
        dept, _ = Department.objects.get_or_create(
            code="operations",
            defaults={"name": "Operations"}
        )
        
        designations_list = [
            "Manager", "Captain", "Chef", "Cashier", "Kitchen Staff", 
            "Waiter", "Receptionist", "Cleaner", "Delivery Executive", "HR"
        ]
        for des_name in designations_list:
            Designation.objects.get_or_create(
                name=des_name,
                department=dept
            )
        self.stdout.write(self.style.SUCCESS("Seeded default departments and designations."))

        # Seed Restaurant, Branch, and Tables
        from apps.core.models import Restaurant, Branch
        from apps.reservation.models import Table

        restaurant, _ = Restaurant.objects.get_or_create(
            code="dinein-main",
            defaults={
                "name": "DineIn Main Restaurant",
                "address": "123 Gourmet Blvd, Tech City",
                "contact_phone": "+15005550006",
                "contact_email": "support@dinein.com"
            }
        )

        branch, _ = Branch.objects.get_or_create(
            branch_code="bangalore-main",
            defaults={
                "restaurant": restaurant,
                "name": "Bangalore Main Branch",
                "address": "45 Tech Park Ring Road, Bangalore",
                "latitude": 12.9716,
                "longitude": 77.5946
            }
        )



        # Seed Tables
        tables_data = [
            {"number": "Table 1", "capacity": 2, "shape": "square", "x_coord": 100, "y_coord": 100},
            {"number": "Table 2", "capacity": 4, "shape": "rectangle", "x_coord": 250, "y_coord": 100},
            {"number": "Table 3", "capacity": 4, "shape": "rectangle", "x_coord": 400, "y_coord": 100},
            {"number": "Table 4", "capacity": 2, "shape": "round", "x_coord": 100, "y_coord": 250},
            {"number": "Table 5", "capacity": 6, "shape": "rectangle", "x_coord": 250, "y_coord": 250},
            {"number": "Table 6", "capacity": 4, "shape": "round", "x_coord": 400, "y_coord": 250},
            {"number": "Table 7", "capacity": 2, "shape": "square", "x_coord": 100, "y_coord": 400},
            {"number": "Table 8", "capacity": 8, "shape": "rectangle", "x_coord": 250, "y_coord": 400},
        ]

        for t_info in tables_data:
            Table.objects.get_or_create(
                branch=branch,
                number=t_info["number"],
                defaults={
                    "capacity": t_info["capacity"],
                    "shape": t_info["shape"],
                    "x_coord": t_info["x_coord"],
                    "y_coord": t_info["y_coord"],
                    "status": "available"
                }
            )
            self.stdout.write(f"Seeded table: {t_info['number']}")

        # Seed Owner User: owner1 / owner@123
        from django.contrib.auth import get_user_model
        User = get_user_model()
        owner_role = Role.objects.filter(code='owner').first()
        if owner_role:
            owner_user = User.objects.filter(username='owner1').first()
            if not owner_user:
                owner_user = User.objects.create_user(
                    email='owner@dinein.com',
                    username='owner1',
                    password='owner@123',
                    first_name='Owner',
                    last_name='CEO',
                    role=owner_role
                )
                self.stdout.write(self.style.SUCCESS("Seeded Owner User: owner1"))
            else:
                owner_user.set_password('owner@123')
                owner_user.role = owner_role
                owner_user.save()
                self.stdout.write(self.style.SUCCESS("Updated/verified Owner User: owner1"))

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))

