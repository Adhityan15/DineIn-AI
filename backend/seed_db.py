import os, sys, django, random
from datetime import datetime, timedelta, date, time
from decimal import Decimal

sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.abspath(__file__))
apps_dir = os.path.join(backend_dir, 'apps')
if apps_dir not in sys.path:
    sys.path.insert(0, apps_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.core.models import Branch
from apps.authentication.models import User
from apps.staff.models import Employee, Attendance
from apps.reservation.models import Reservation, Waitlist, Table
from apps.inventory.models import MenuItem, Ingredient, InventoryBatch, ReorderAlert, Order, OrderItem, Vendor

print("=================== SEEDING COMPREHENSIVE DINEIN AI DATA ===================")

main_branch = Branch.objects.filter(id='c25e6dd3-b6e7-436e-99ed-13c0e965eb03').first() or Branch.objects.first()
print('Target Branch:', main_branch.name, main_branch.id)

# 1. TABLES
for i in range(1, 26):
    Table.objects.get_or_create(
        branch=main_branch,
        number=f'T-{i:02d}',
        defaults={
            'capacity': random.choice([2, 4, 4, 6, 8]),
            'status': random.choice(['available', 'occupied', 'reserved', 'available'])
        }
    )
print('✅ Tables count:', Table.objects.filter(branch=main_branch).count())

# 2. RESERVATIONS & WAITLIST QUEUE
guest_names = [
    ('Courtney Henry', '+919876543210', 'courtney@example.com'),
    ('Devon Lane', '+919876543211', 'devon@example.com'),
    ('Esther Howard', '+919876543212', 'esther@example.com'),
    ('Jane Cooper', '+919876543213', 'jane@example.com'),
    ('Robert Fox', '+919876543214', 'robert@example.com'),
    ('Eleanor Pena', '+919876543215', 'eleanor@example.com'),
    ('Cody Fisher', '+919876543216', 'cody@example.com'),
    ('Kristin Watson', '+919876543217', 'kristin@example.com'),
    ('Cameron Williamson', '+919876543218', 'cameron@example.com'),
    ('Brooklyn Simmons', '+919876543219', 'brooklyn@example.com'),
    ('Leslie Alexander', '+919876543220', 'leslie@example.com'),
    ('Guy Hawkins', '+919876543221', 'guy@example.com'),
    ('Savannah Nguyen', '+919876543222', 'savannah@example.com'),
    ('Darlene Robertson', '+919876543223', 'darlene@example.com'),
    ('Ralph Edwards', '+919876543224', 'ralph@example.com')
]

now_dt = datetime.now()

for idx, (g_name, g_phone, g_email) in enumerate(guest_names):
    st_time = now_dt.replace(hour=12 + (idx % 9), minute=0, second=0)
    end_time = st_time + timedelta(hours=2)
    Reservation.objects.get_or_create(
        branch=main_branch,
        guest_name=g_name,
        start_time=st_time,
        defaults={
            'end_time': end_time,
            'guest_phone': g_phone,
            'guest_email': g_email,
            'party_size': random.choice([2, 4, 4, 6]),
            'status': random.choice(['seated', 'confirmed', 'completed', 'seated']),
            'special_requests': random.choice(['Window seat requested', 'Birthday cake', 'High chair', 'Anniversary'])
        }
    )
print('✅ Reservations count:', Reservation.objects.filter(branch=main_branch).count())

# Active Waitlist Queue
waitlist_guests = [
    ('Arun Kumar', '+919988776611', 2, 10),
    ('Priya Sharma', '+919988776622', 4, 15),
    ('Karthik Raja', '+919988776633', 6, 25),
    ('Meera Nair', '+919988776644', 2, 5),
    ('Vikram Sethi', '+919988776655', 3, 20),
    ('Ananya Roy', '+919988776666', 5, 12),
    ('Siddharth Malhotra', '+919988776677', 4, 18),
    ('Deepika Padukone', '+919988776688', 2, 8)
]
for pos_idx, (w_name, w_phone, w_size, w_est) in enumerate(waitlist_guests):
    Waitlist.objects.get_or_create(
        branch=main_branch,
        guest_name=w_name,
        defaults={
            'guest_phone': w_phone,
            'party_size': w_size,
            'position': pos_idx + 1,
            'status': 'waiting',
            'estimated_wait_minutes': w_est
        }
    )
print('✅ Waitlist count:', Waitlist.objects.filter(branch=main_branch).count())

# 3. INVENTORY ITEMS, BATCHES & REORDER ALERTS
ing_seed = [
    ('Cheddar Cheese Slice', 'dairy', 'kg', Decimal('3.50'), Decimal('10.00'), Decimal('450.00')),
    ('Burger Patties (Prime Beef)', 'meat', 'pcs', Decimal('12.00'), Decimal('50.00'), Decimal('120.00')),
    ('Fresh Lettuce Leaves', 'vegetables', 'kg', Decimal('1.20'), Decimal('5.00'), Decimal('80.00')),
    ('Basmati Rice (Aged)', 'dry_goods', 'kg', Decimal('45.00'), Decimal('100.00'), Decimal('110.00')),
    ('Fresh Chicken Breast', 'meat', 'kg', Decimal('4.80'), Decimal('20.00'), Decimal('260.00')),
    ('Pure Olive Oil', 'others', 'L', Decimal('2.10'), Decimal('15.00'), Decimal('650.00')),
    ('Italian Tomato Puree', 'dry_goods', 'L', Decimal('3.80'), Decimal('12.00'), Decimal('140.00')),
    ('Whole Milk (Organic)', 'dairy', 'L', Decimal('5.00'), Decimal('25.00'), Decimal('65.00')),
    ('Heavy Cream', 'dairy', 'L', Decimal('1.50'), Decimal('8.00'), Decimal('220.00')),
    ('Unsalted Butter', 'dairy', 'kg', Decimal('2.20'), Decimal('10.00'), Decimal('480.00')),
    ('Garam Masala Blend', 'spices', 'kg', Decimal('0.80'), Decimal('3.00'), Decimal('850.00')),
    ('Arabica Coffee Beans', 'beverages', 'kg', Decimal('2.50'), Decimal('8.00'), Decimal('1200.00'))
]

for ing_name, ing_cat, unit, curr_qty, min_qty, u_price in ing_seed:
    ing, _ = Ingredient.objects.get_or_create(
        name=ing_name,
        defaults={'category': ing_cat, 'unit': unit, 'min_stock': min_qty, 'max_stock': min_qty * 5}
    )
    InventoryBatch.objects.get_or_create(
        branch=main_branch,
        ingredient=ing,
        batch_number=f"BATCH-{ing.id.hex[:6].upper()}",
        defaults={'quantity': curr_qty, 'purchase_price': u_price, 'status': 'active'}
    )
    if curr_qty < min_qty:
        ReorderAlert.objects.get_or_create(
            branch=main_branch,
            ingredient=ing,
            defaults={'alert_type': 'low_stock', 'status': 'active', 'message': f"Low stock alert: {ing.name} quantity ({curr_qty} {unit}) is below safety threshold ({min_qty} {unit})."}
        )

print('✅ Ingredients count:', Ingredient.objects.count())
print('✅ Active Reorder Alerts count:', ReorderAlert.objects.filter(branch=main_branch, status='active').count())

# 4. MENU & POS ORDERS
menu_seed = [
    ('Truffle Mushroom Crostini', 'Appetizers & Starters', Decimal('380.00')),
    ('Paneer Tikka Angara', 'Appetizers & Starters', Decimal('340.00')),
    ('Crispy Calamari Rings', 'Appetizers & Starters', Decimal('420.00')),
    ('Signature Ribeye Steak (300g)', 'Executive Main Course', Decimal('1150.00')),
    ('Grilled Norwegian Salmon', 'Executive Main Course', Decimal('1280.00')),
    ('Butter Chicken Supreme', 'Executive Main Course', Decimal('490.00')),
    ('Classic Cheese Burger Deluxe', 'Executive Main Course', Decimal('420.00')),
    ('Iced Cold Brew Latte', 'Artisanal Beverages', Decimal('220.00')),
    ('Fresh Mint Passion Fruit Mojito', 'Artisanal Beverages', Decimal('250.00')),
    ('Belgian Chocolate Lava Cake', 'Gourmet Desserts', Decimal('360.00')),
    ('Classic Tiramisu Cup', 'Gourmet Desserts', Decimal('390.00'))
]

menu_objs = [MenuItem.objects.get_or_create(name=m_name, defaults={'category': m_cat, 'price': m_price, 'is_available': True})[0] for m_name, m_cat, m_price in menu_seed]

tables_list = list(Table.objects.filter(branch=main_branch))

for o_idx in range(1, 26):
    o, created = Order.objects.get_or_create(
        branch=main_branch,
        customer_name=f'Diner #{o_idx:02d}',
        customer_phone=f'+9198765{o_idx:05d}',
        defaults={
            'source': random.choice(['direct', 'swiggy', 'zomato']),
            'order_type': random.choice(['dine_in', 'takeaway', 'delivery']),
            'status': 'completed',
            'table': random.choice(tables_list) if tables_list else None,
            'total_amount': Decimal('0.00')
        }
    )
    if created or o.total_amount == Decimal('0.00'):
        tot = Decimal('0.00')
        for m in random.sample(menu_objs, 3):
            qty = random.randint(1, 3)
            item_tot = m.price * qty
            tot += item_tot
            OrderItem.objects.create(order=o, menu_item=m, quantity=qty, unit_price=m.price)
        o.total_amount = tot
        o.save()

print('✅ POS Orders count:', Order.objects.filter(branch=main_branch).count())

# 5. ATTENDANCE & STAFF
employees = list(Employee.objects.filter(user__branch=main_branch))
today_d = date.today()
shift_start = now_dt.replace(hour=9, minute=0, second=0)
for emp in employees[:45]:
    Attendance.objects.get_or_create(
        employee=emp,
        date=today_d,
        defaults={'clock_in': shift_start + timedelta(minutes=random.randint(-10, 15)), 'status': 'present'}
    )

print('✅ Attendance records for today:', Attendance.objects.filter(employee__user__branch=main_branch, date=today_d).count())
print("=================== DATA SEEDING COMPLETED 100% ===================")
