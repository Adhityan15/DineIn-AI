from django.core.management.base import BaseCommand
from django.conf import settings
import sys

class Command(BaseCommand):
    help = "Fast, idempotent Render PostgreSQL database seeder."

    def handle(self, *args, **options):
        setattr(settings, 'SEEDING', True)
        self.stdout.write("=================== FAST SEEDING RENDER DB ===================")
        
        from django.contrib.auth import get_user_model
        from apps.authentication.models import Role
        from apps.core.models import Restaurant, Branch
        from apps.reservation.models import Table, Reservation
        from apps.inventory.models import MenuItem, Ingredient, Order, InventoryBatch
        from apps.staff.models import Employee, Department, Designation
        from apps.feedback.models import CustomerReview
        from django.utils import timezone
        import datetime, random, uuid

        User = get_user_model()

        # 1. Setup Roles
        admin_role, _ = Role.objects.get_or_create(code='admin', defaults={'name': 'Administrator'})
        manager_role, _ = Role.objects.get_or_create(code='manager', defaults={'name': 'Branch Manager'})
        staff_role, _ = Role.objects.get_or_create(code='kitchen_staff', defaults={'name': 'Kitchen Staff'})
        customer_role, _ = Role.objects.get_or_create(code='customer', defaults={'name': 'Customer'})

        # 2. Setup Restaurant & Branch
        restaurant, _ = Restaurant.objects.get_or_create(
            code="chennai-dinein",
            defaults={
                "name": "Chennai DineIn Group",
                "contact_email": "ops@chennai-dinein.in",
                "contact_phone": "+914422445566",
                "address": "Adambakkam Chennai, India"
            }
        )
        branch, _ = Branch.objects.get_or_create(
            branch_code="adambakkam-chennai",
            defaults={
                "restaurant": restaurant,
                "name": "Adambakkam Chennai",
                "latitude": 12.9880,
                "longitude": 80.2052,
                "geofence_radius": 150,
                "address": "No.12, Veerangal Street, Adambakkam, Chennai, Tamil Nadu - 600088"
            }
        )

        # 3. Create / Ensure admin1 user
        admin1 = User.objects.filter(username='admin1').first()
        if not admin1:
            admin1 = User.objects.filter(email='adhityanmclaren@gmail.com').first()

        if not admin1:
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
        else:
            admin1.username = 'admin1'
            admin1.email = 'adhityanmclaren@gmail.com'
            admin1.role = admin_role
            admin1.branch = branch
            admin1.is_staff = True
            admin1.is_superuser = True
            admin1.is_active = True
            admin1.set_password('Admin@123')
            admin1.save()
        self.stdout.write(f"[OK] admin1 user verified: {admin1.username} ({admin1.email})")

        # 4. Tables (20)
        tables = []
        for i in range(1, 21):
            t, _ = Table.objects.get_or_create(
                number=f"T{i}",
                branch=branch,
                defaults={"capacity": 4 if i <= 15 else 6, "status": "available"}
            )
            tables.append(t)

        # 5. Customers (15)
        customers = []
        for i in range(15):
            u, _ = User.objects.get_or_create(
                email=f"customer_{i}@adambakkam.in",
                defaults={
                    "username": f"cust_{i}_{uuid.uuid4().hex[:4]}",
                    "first_name": f"Customer{i}",
                    "last_name": "Raman",
                    "phone": f"+919940112{i:03d}",
                    "role": customer_role,
                    "branch": branch
                }
            )
            customers.append(u)

        # 6. Staff & Employees (10)
        dept, _ = Department.objects.get_or_create(code="kitchen", defaults={"name": "Kitchen Dept"})
        desig, _ = Designation.objects.get_or_create(name="Chef", defaults={"department": dept})
        employees = []
        for i in range(10):
            su, _ = User.objects.get_or_create(
                email=f"staff_{i}@chennai-dinein.in",
                defaults={
                    "username": f"staff_{i}_{uuid.uuid4().hex[:4]}",
                    "first_name": f"Staff{i}",
                    "last_name": "Chennai",
                    "phone": f"+919840223{i:03d}",
                    "role": staff_role,
                    "branch": branch
                }
            )
            emp, _ = Employee.objects.get_or_create(
                user=su,
                defaults={
                    "employee_id": f"MEMBER-{i:03d}",
                    "designation": desig,
                    "status": "active",
                    "hire_date": timezone.now().date(),
                    "hourly_rate": 250
                }
            )
            employees.append(emp)

        # 7. Menu Items (11)
        menu_items_data = [
            ("Chicken Chettinad Biryani", 320, "Biryani"),
            ("Mutton Sukka", 380, "Starters"),
            ("Paneer Butter Masala", 260, "Main Course"),
            ("Malabar Parotta (2 pcs)", 60, "Breads"),
            ("South Indian Meals Thali", 220, "Thalis"),
            ("Madras Filter Coffee", 40, "Beverages"),
            ("Jigarthanda Special", 120, "Desserts"),
            ("Ghee Roast Dosa", 110, "Breakfast"),
            ("Chicken 65", 280, "Starters"),
            ("Dragon Chicken", 290, "Indo-Chinese"),
            ("Garlic Naan", 70, "Breads")
        ]
        menu_objs = []
        for name, price, cat in menu_items_data:
            mi, _ = MenuItem.objects.get_or_create(
                name=name,
                defaults={"price": price, "category": cat, "branch": branch, "is_available": True}
            )
            menu_objs.append(mi)

        # 8. Ingredients & Inventory (12)
        ing_names = ["Basmati Rice", "Chicken Breast", "Mutton Chunks", "Paneer Cubes", "Whole Milk", "Coffee Powder", "Pure Ghee", "Refined Oil", "Onions", "Tomatoes", "Ginger Garlic Paste", "Chettinad Masala"]
        for ing_name in ing_names:
            ing, _ = Ingredient.objects.get_or_create(
                name=ing_name,
                defaults={"unit": "kg", "unit_cost": 150, "reorder_level": 10, "branch": branch}
            )
            InventoryBatch.objects.get_or_create(
                ingredient=ing,
                batch_number=f"BATCH-{uuid.uuid4().hex[:6].upper()}",
                defaults={"quantity": 100, "expiry_date": timezone.now().date() + datetime.timedelta(days=30), "branch": branch}
            )

        # 9. Reservations (10)
        for i in range(10):
            c = customers[i % len(customers)]
            t = tables[i % len(tables)]
            r, _ = Reservation.objects.get_or_create(
                branch=branch,
                customer=c,
                reservation_date=timezone.now().date() + datetime.timedelta(days=i % 3),
                reservation_time="19:30:00",
                defaults={"guest_count": 2, "status": "confirmed"}
            )
            r.tables.add(t)

        # 10. Orders & Invoices (10)
        for i in range(10):
            c = customers[i % len(customers)]
            t = tables[i % len(tables)]
            ord_obj, _ = Order.objects.get_or_create(
                order_number=f"ORD-{i+1000}",
                defaults={"branch": branch, "table": t, "status": "completed", "total_amount": 750, "customer_phone": c.phone}
            )

        # 11. Customer Reviews (10)
        review_texts = [
            "Authentic Chettinad taste! Filter coffee was exceptional.",
            "Fast service, great ambience, highly recommended.",
            "Best biryani in Adambakkam! Staff was very courteous.",
            "Loved the Paneer Butter Masala and Parottas.",
            "Great value for money. Will visit again soon!"
        ]
        for i in range(10):
            c = customers[i % len(customers)]
            CustomerReview.objects.get_or_create(
                branch=branch,
                customer_name=f"{c.first_name} {c.last_name}",
                defaults={"rating": 5, "review_text": random.choice(review_texts), "sentiment": "positive"}
            )

        self.stdout.write(self.style.SUCCESS("=================== FAST SEEDING COMPLETED 100% ==================="))
