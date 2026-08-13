import datetime
import random
import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from apps.authentication.models import Role, LoyaltyProfile
from apps.core.models import Restaurant, Branch, Notification, Invoice, POSPayment
from apps.reservation.models import Reservation, Table, ReservationTable, ReservationHistory
from apps.inventory.models import Ingredient, InventoryBatch, StockMovement, Purchase, PurchaseItem, MenuItem, Order, OrderItem, Vendor, DailyStockRecord
from apps.staff.models import Department, Designation, Employee, Shift, Schedule, Attendance, PerformanceReview, Leave, LeaveType, EmployeeAvailability, PayrollSummary
from apps.feedback.models import TopicCategory, CustomerReview, ReviewInsight, ReputationSnapshot, AIRecommendation, WeeklyFeedbackSummary

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with a complete, realistic operational dataset for Adambakkam Chennai branch."

    def handle(self, *args, **options):
        self.stdout.write("Initializing Chennai Branch database seeding...")
        
        with transaction.atomic():
            # 0. Clean old operational data to make room
            self.stdout.write("Wiping old records to prevent constraint errors...")
            ReservationHistory.objects.all().delete()
            ReservationTable.objects.all().delete()
            Reservation.objects.all().delete()
            Table.objects.all().delete()
            
            POSPayment.objects.all().delete()
            Invoice.objects.all().delete()
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            
            StockMovement.objects.all().delete()
            InventoryBatch.objects.all().delete()
            PurchaseItem.objects.all().delete()
            Purchase.objects.all().delete()
            Ingredient.objects.all().delete()
            Vendor.objects.all().delete()
            MenuItem.objects.all().delete()
            
            Attendance.objects.all().delete()
            Schedule.objects.all().delete()
            Leave.objects.all().delete()
            PayrollSummary.objects.all().delete()
            PerformanceReview.objects.all().delete()
            EmployeeAvailability.objects.all().delete()
            Employee.objects.all().delete()
            
            CustomerReview.objects.all().delete()
            ReviewInsight.objects.all().delete()
            ReputationSnapshot.objects.all().delete()
            WeeklyFeedbackSummary.objects.all().delete()

            # 1. Setup Restaurant & Chennai Branch
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

            # 2. Seed 40 Tables
            self.stdout.write("Creating 40 tables...")
            tables = []
            for i in range(1, 41):
                t, _ = Table.objects.get_or_create(
                    number=f"T{i}",
                    branch=branch,
                    defaults={
                        "capacity": 2 if i <= 15 else (4 if i <= 30 else (6 if i <= 37 else 8)),
                        "status": "available" if i % 10 != 0 else "occupied"
                    }
                )
                tables.append(t)

            # 3. Fetch Roles
            roles = {r.code: r for r in Role.objects.all()}
            manager_role = roles.get('manager')
            staff_role = roles.get('kitchen_staff')
            customer_role = roles.get('customer')

            # 4. Generate 400 Customer Users
            self.stdout.write("Generating 400 customer users & profiles...")
            customers = []
            first_names_cust = ["Rajesh", "Priya", "Arvind", "Sundar", "Lakshmi", "Karthik", "Anjali", "Suresh", "Divya", "Vijay", "Sandhya", "Hari", "Deepa", "Ramesh"]
            last_names_cust = ["Raman", "Krishnan", "Subramanian", "Balaji", "Narayanan", "Raghavan", "Venkatesh", "Chidambaram", "Srinivasan", "Mani"]
            
            for i in range(50):
                email = f"customer{i}@adambakkam.in"
                user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": f"cust_{i}_{uuid.uuid4().hex[:4]}",
                        "first_name": random.choice(first_names_cust),
                        "last_name": random.choice(last_names_cust),
                        "phone": f"+919940112{i:03d}",
                        "role": customer_role,
                        "branch": branch
                    }
                )
                LoyaltyProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        "points": random.randint(50, 1200),
                        "tier": random.choice(["bronze", "silver", "gold", "platinum"]),
                        "is_active": True
                    }
                )
                customers.append(user)

            # 5. Generate 60 Staff Employees
            self.stdout.write("Generating 60 staff members...")
            dept_kitchen, _ = Department.objects.get_or_create(code="kitchen", defaults={"name": "Kitchen Dept"})
            dept_service, _ = Department.objects.get_or_create(code="service", defaults={"name": "Guest Services"})
            dept_admin, _ = Department.objects.get_or_create(code="admin", defaults={"name": "Operations Administration"})
            dept_hr, _ = Department.objects.get_or_create(code="hr", defaults={"name": "HR Department"})

            desig_manager = Designation.objects.create(name="Manager", department=dept_admin)
            desig_chef = Designation.objects.create(name="Chef", department=dept_kitchen)
            desig_server = Designation.objects.create(name="Server", department=dept_service)
            desig_cashier = Designation.objects.create(name="Cashier", department=dept_service)
            desig_cleaner = Designation.objects.create(name="Cleaner", department=dept_service)
            desig_hr = Designation.objects.create(name="HR Roster Specialist", department=dept_hr)

            first_names_staff = ["Adhityan", "Vikram", "Ganesh", "Reka", "Sanjay", "Kamal", "Shalini", "Sridhar", "Meena", "Manikandan", "Nisha", "Balaji", "Kousalya"]
            last_names_staff = ["Sundaram", "Kalyan", "Natarajan", "Sekar", "Pandian", "Elangovan", "Pillai", "Mudaliar", "Naidu", "Reddy"]
            
            employees = []
            for i in range(60):
                email = f"staff{i}@chennai-dinein.in"
                # Set up designated roles
                if i < 4:
                    desig = desig_manager
                    role = manager_role
                elif i < 15:
                    desig = desig_chef
                    role = staff_role
                elif i < 35:
                    desig = desig_server
                    role = staff_role
                elif i < 45:
                    desig = desig_cashier
                    role = staff_role
                elif i < 56:
                    desig = desig_cleaner
                    role = staff_role
                else:
                    desig = desig_hr
                    role = manager_role

                user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": f"staff_{i}_{uuid.uuid4().hex[:4]}",
                        "first_name": random.choice(first_names_staff),
                        "last_name": random.choice(last_names_staff),
                        "phone": f"+919840223{i:03d}",
                        "role": role,
                        "branch": branch
                    }
                )
                if not user.check_password("Password123!"):
                    user.set_password("Password123!")
                    user.save()

                emp = Employee.objects.create(
                    user=user,
                    employee_id=f"MEMBER-{i:03d}",
                    designation=desig,
                    skills="culinary, safety, HACCP" if desig == desig_chef else "hospitality, cash-handling, guest-relations",
                    status="active",
                    hire_date=timezone.now().date() - datetime.timedelta(days=random.randint(30, 360)),
                    hourly_rate=random.randint(120, 450)
                )
                employees.append(emp)

            # 6. Roster attendance logs for past 7 days
            self.stdout.write("Rostering shift attendance for past 7 days...")
            shift_morning, _ = Shift.objects.get_or_create(
                name="Morning Chennai Shift",
                defaults={"start_time": "08:00:00", "end_time": "16:00:00"}
            )
            shift_evening, _ = Shift.objects.get_or_create(
                name="Evening Chennai Shift",
                defaults={"start_time": "16:00:00", "end_time": "00:00:00"}
            )

            today = timezone.now().date()
            attendance_records = []
            for day_idx in range(7):
                date_cursor = today - datetime.timedelta(days=day_idx)
                for emp in employees:
                    # Skip some employees to simulate off days
                    if random.random() < 0.15:
                        continue
                    
                    shift = shift_morning if random.choice([True, False]) else shift_evening
                    Schedule.objects.create(
                        employee=emp,
                        date=date_cursor,
                        shift=shift
                    )
                    
                    clock_in_time = datetime.datetime.combine(date_cursor, datetime.time(8, 0)) + datetime.timedelta(minutes=random.randint(-15, 30))
                    clock_in_tz = timezone.make_aware(clock_in_time)
                    clock_out_tz = clock_in_tz + datetime.timedelta(hours=8)
                    
                    att = Attendance.objects.create(
                        employee=emp,
                        date=date_cursor,
                        clock_in=clock_in_tz,
                        clock_out=clock_out_tz,
                        clock_in_latitude=12.9880,
                        clock_in_longitude=80.2052,
                        status="present" if random.random() > 0.1 else "late",
                        is_anomaly=False
                    )
                    attendance_records.append(att)

            # 7. Seed 60 Payroll summaries
            self.stdout.write("Generating 60 payroll summaries...")
            for emp in employees:
                PayrollSummary.objects.create(
                    employee=emp,
                    month="2026-07",
                    working_days=random.randint(20, 26),
                    working_hours=random.randint(160, 208),
                    overtime_hours=random.randint(2, 18),
                    leave_days=random.randint(0, 3)
                )

            # 8. Seed 20 Leave Requests
            self.stdout.write("Generating 20 staff leave requests...")
            leave_type_objs = []
            for code in ["sick", "casual", "earned"]:
                lt_obj, _ = LeaveType.objects.get_or_create(code=code, defaults={"name": code.capitalize()})
                leave_type_objs.append(lt_obj)
                
            for i in range(20):
                emp = random.choice(employees)
                start_l = today - datetime.timedelta(days=random.randint(-10, 10))
                Leave.objects.create(
                    employee=emp,
                    start_date=start_l,
                    end_date=start_l + datetime.timedelta(days=random.randint(1, 3)),
                    leave_type=random.choice(leave_type_objs),
                    reason="Personal emergency / Medical consult",
                    status=random.choice(["pending", "approved", "rejected"])
                )

            # 9. Seed 25 Suppliers (Vendors)
            self.stdout.write("Creating 25 Chennai local fresh suppliers...")
            vendors = []
            supplier_names = ["Koyambedu Fresh Vegetables Wholesale", "Aavin Milk Dairy Distributor", "Classic Meat Chennai", "Mylapore Spices Trading", "Nellore Rice Mill Supplies", "Zha Cafe Bakery Vendors", "South Indian Coffee Roasters", "Sea Fresh Marina Fish Supply"]
            for i in range(25):
                v_name = supplier_names[i % len(supplier_names)] + f" - Unit {i}"
                v = Vendor.objects.create(
                    name=v_name,
                    contact_name=f"Vendor Contact {i}",
                    phone=f"+919840445{i:03d}",
                    email=f"supplier{i}@koyambedu.in",
                    address=f"Veerangal Road, Chennai - {600000+i}",
                    performance_score=random.uniform(80.0, 99.0)
                )
                vendors.append(v)

            # 10. Seed 150 Ingredients
            self.stdout.write("Generating 150 ingredients...")
            ingredient_names = [
                ("Idli Rice", "dry_goods"), ("Urad Dal", "dry_goods"), ("Toor Dal", "dry_goods"),
                ("Sunflower Oil", "others"), ("Ghee", "dairy"), ("Organic Tomatoes", "vegetables"),
                ("Sambar Onions", "vegetables"), ("Green Chillies", "vegetables"), ("Curry Leaves", "vegetables"),
                ("Coriander", "vegetables"), ("Garlic Bulbs", "vegetables"), ("Ginger Roots", "vegetables"),
                ("Mustard Seeds", "spices"), ("Tamarind", "spices"), ("Red Chilli Powder", "spices"),
                ("Turmeric Powder", "spices"), ("Asafoetida", "spices"), ("Sea Salt", "spices"),
                ("Fresh Milk", "dairy"), ("Yogurt Curd", "dairy"), ("Paneer Cubes", "dairy"),
                ("Chicken Thighs", "meat"), ("Mutton Pieces", "meat"), ("Egg Box", "meat"),
                ("Jaggery", "others"), ("Coconut Grated", "vegetables")
            ]
            
            ingredients = []
            for i in range(150):
                template = ingredient_names[i % len(ingredient_names)]
                name = f"{template[0]} - grade {i//len(ingredient_names) + 1}"
                ing = Ingredient.objects.create(
                    name=name,
                    category=template[1],
                    unit="kg" if template[1] != "others" else "L",
                    min_stock=random.randint(15, 60),
                    max_stock=random.randint(150, 400),
                    abc_class=random.choice(["A", "B", "C"])
                )
                ingredients.append(ing)

            # 11. Seed 120 Purchase orders & Inventory Batches
            self.stdout.write("Creating 120 local purchase invoice orders...")
            for i in range(120):
                purchase = Purchase.objects.create(
                    branch=branch,
                    vendor=random.choice(vendors),
                    invoice_no=f"CH-PO-{i:05d}",
                    purchase_date=today - datetime.timedelta(days=random.randint(1, 14))
                )
                # create items
                for ing in random.sample(ingredients, 3):
                    qty = random.randint(20, 80)
                    price = random.randint(40, 400) # Rupees
                    batch_no = f"B-CH-{random.randint(10000, 99999)}"
                    expiry = today + datetime.timedelta(days=random.randint(10, 60))
                    
                    PurchaseItem.objects.create(
                        purchase=purchase,
                        ingredient=ing,
                        quantity=qty,
                        purchase_unit="kg",
                        unit_price=price,
                        batch_number=batch_no,
                        expiry_date=expiry
                    )
                    
                    batch = InventoryBatch.objects.create(
                        branch=branch,
                        ingredient=ing,
                        quantity=qty - random.randint(1, 5),
                        batch_number=batch_no,
                        purchase_price=price,
                        expiry_date=expiry,
                        status="active"
                    )
                    
                    StockMovement.objects.create(
                        branch=branch,
                        ingredient=ing,
                        batch=batch,
                        quantity=qty,
                        movement_type="purchase",
                        description=f"Received PO inventory batch {batch.batch_number}"
                    )

            # 12. Create 250 Reservations (VIP, walkin, cancelled, completed)
            self.stdout.write("Generating 250 reservations with audit history...")
            reservation_statuses = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"]
            reservations = []
            for i in range(250):
                offset_days = random.randint(-6, 7)
                res_time = timezone.now() + datetime.timedelta(days=offset_days)
                res_time = res_time.replace(hour=random.randint(11, 22), minute=random.choice([0, 30]), second=0, microsecond=0)
                
                res = Reservation.objects.create(
                    branch=branch,
                    customer=random.choice(customers),
                    guest_name=f"Chennai Patron {i}",
                    guest_phone=f"+919940112{i:03d}",
                    guest_email=f"patron{i}@chennai.in",
                    party_size=random.choice([2, 4, 6, 8]),
                    start_time=res_time,
                    end_time=res_time + datetime.timedelta(hours=2),
                    status=random.choice(reservation_statuses),
                    is_walk_in=(i % 4 == 0),
                    is_vip=(i % 15 == 0),
                    special_requests="Request window seat/high chair" if i % 12 == 0 else ""
                )
                # assign table
                ReservationTable.objects.create(
                    reservation=res,
                    table=random.choice(tables)
                )
                # create audit trail history
                ReservationHistory.objects.create(
                    reservation=res,
                    status=res.status,
                    reason=f"State transitioned to {res.status} by local host coordinator."
                )
                reservations.append(res)

            # 13. Seed Menu Items
            self.stdout.write("Registering Indian MenuItems catalog...")
            menu_data = [
                ("Idli Sambar Plates", 90.00), ("Crispy Onion Ghee Roast Dosa", 160.00),
                ("Kothu Parotta Veg", 140.00), ("Egg Kothu Parotta Chennai", 180.00),
                ("Chicken Kothu Parotta", 220.00), ("Mutton Chukka", 380.00),
                ("Chicken Chettinad Masala", 310.00), ("Malabar Parotta (2 pcs)", 60.00),
                ("Steaming Veg Biryani", 200.00), ("Ambur Chicken Biryani", 290.00),
                ("Premium Chennai Filter Coffee", 70.00), ("Paneer Butter Masala", 280.00)
            ]
            menu_items = []
            for name, price in menu_data:
                mi = MenuItem.objects.create(
                    name=name,
                    price=price,
                    is_active=True
                )
                menu_items.append(mi)

            # 14. Seed 600 Orders & 400 Kitchen tickets
            self.stdout.write("Generating 600 Orders & 400 Kitchen tickets...")
            order_statuses = ["pending", "preparing", "ready", "completed", "cancelled"]
            orders = []
            
            # Populate 600 orders
            for i in range(600):
                status_choice = random.choice(order_statuses)
                # 400 orders (tickets) should have preparing / ready / pending to show up in kitchen display
                if i < 400:
                    status_choice = random.choice(["pending", "preparing", "ready"])
                
                o = Order.objects.create(
                    branch=branch,
                    source=random.choice(["dine_in", "takeaway", "delivery"]),
                    status=status_choice,
                    order_type=random.choice(["dine_in", "takeaway", "delivery"]),
                    table=random.choice(tables),
                    customer_name=f"Dining Guest {i}",
                    customer_phone=f"+919840112{i:03d}",
                    total_amount=0.0
                )
                
                # order items
                total_val = 0.0
                for mi in random.sample(menu_items, random.randint(1, 3)):
                    qty = random.randint(1, 4)
                    item_val = mi.price * qty
                    total_val += float(item_val)
                    
                    OrderItem.objects.create(
                        order=o,
                        menu_item=mi,
                        quantity=qty,
                        unit_price=mi.price,
                        kitchen_notes="Spice level high" if i % 10 == 0 else ""
                    )
                
                o.total_amount = total_val
                o.save()
                orders.append(o)

            # 15. Seed 500 Invoices (₹ values only, no dollars!)
            self.stdout.write("Generating 500 POS billing invoices & payments...")
            invoice_statuses = ["paid", "refunded", "cancelled"]
            for i in range(500):
                linked_order = orders[i % len(orders)]
                sub = linked_order.total_amount
                gst = round(sub * 0.05, 2)
                sc = round(sub * 0.05, 2)
                total = sub + gst + sc
                
                inv_status = random.choice(invoice_statuses)
                if i < 420:
                    inv_status = "paid"
                
                inv = Invoice.objects.create(
                    branch=branch,
                    order=linked_order,
                    subtotal=sub,
                    gst=gst,
                    service_charge=sc,
                    discount=0.00,
                    total=total,
                    payment_method=random.choice(["cash", "upi", "card"]),
                    status=inv_status,
                    transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}"
                )
                
                POSPayment.objects.create(
                    invoice=inv,
                    payment_method=inv.payment_method,
                    amount=inv.total,
                    payment_id=f"PAY-{uuid.uuid4().hex[:10].upper()}",
                    transaction_id=inv.transaction_id,
                    branch=branch,
                    status="success" if inv_status != "cancelled" else "failed"
                )

            # 16. Seed 250 Customer Reviews
            self.stdout.write("Generating 250 reviews & sentiment insights...")
            review_sentiments = [
                ("Loved the crispy onion Ghee roast dosa, perfectly toasted filter coffee!", "positive", 5),
                ("Worst waiting time. Took 40 minutes for simple idli plate. Incompetent waiters.", "negative", 1),
                ("Average food quality. Tomato chutney was sour, paneer masala was okay.", "neutral", 3),
                ("flawless service by waiter Balaji at Adambakkam branch. Ambience is premium.", "positive", 5),
                ("High pricing for Malabar parotta. Too oily.", "negative", 2)
            ]
            
            for i in range(30):
                text, sent, rating = random.choice(review_sentiments)
                rev = CustomerReview.objects.create(
                    branch=branch,
                    author_name=f"Guest Critic {i}",
                    source=random.choice(["google_maps", "internal"]),
                    rating=rating,
                    comment=f"Review #{i}: {text}",
                    visit_date=today - datetime.timedelta(days=random.randint(0, 10)),
                    is_analyzed=True,
                    sentiment=sent,
                    confidence_score=0.98
                )
                
                ReviewInsight.objects.create(
                    review=rev,
                    sentiment=sent,
                    sentiment_score=0.95 if sent == "positive" else (-0.95 if sent == "negative" else 0.0),
                    emotion="Happy" if sent == "positive" else ("Angry" if sent == "negative" else "Neutral"),
                    positive_keywords=["dosa", "filter coffee"] if sent == "positive" else [],
                    negative_keywords=["wait", "oily", "sour"] if sent == "negative" else [],
                    ai_summary="Patron shared feedback about dining taste and service time.",
                    manager_action_items=["Verify recipe standards" if sent == "negative" else "Maintain good practice"]
                )

            # 17. Seed Analytics Snapshot trend metrics
            self.stdout.write("Populating analytics trend metrics...")
            for days_back in range(14, -1, -1):
                ReputationSnapshot.objects.create(
                    branch=branch,
                    date=today - datetime.timedelta(days=days_back),
                    reputation_score=random.uniform(88.0, 95.0),
                    rating_avg=random.uniform(4.2, 4.7),
                    sentiment_index=random.uniform(75.0, 88.0),
                    nps_score=random.uniform(62.0, 78.0),
                    total_reviews=200 + (14 - days_back) * 5
                )

            WeeklyFeedbackSummary.objects.create(
                week_start=today - datetime.timedelta(days=7),
                week_end=today,
                total_reviews=250,
                positive_reviews=160,
                neutral_reviews=40,
                negative_reviews=50,
                average_rating=4.3,
                top_category="Food Taste",
                trending_metric="Dosa options score highly."
            )

        # Output final report counts
        self.stdout.write("\n==================================================")
        self.stdout.write("CHENNAI DATA SEEDING COMPLETE! RECORD COUNTS:")
        self.stdout.write(f"  Restaurant count: {Restaurant.objects.count()}")
        self.stdout.write(f"  Branch count: {Branch.objects.count()} (Name: {branch.name})")
        self.stdout.write(f"  Table count: {Table.objects.filter(branch=branch).count()}")
        self.stdout.write(f"  Customer user count: {User.objects.filter(role=customer_role).count()}")
        self.stdout.write(f"  Employee staff count: {Employee.objects.count()}")
        self.stdout.write(f"  Attendance logs: {Attendance.objects.count()}")
        self.stdout.write(f"  Leave requests count: {Leave.objects.count()}")
        self.stdout.write(f"  Payroll summaries: {PayrollSummary.objects.count()}")
        self.stdout.write(f"  Supplier/Vendor count: {Vendor.objects.count()}")
        self.stdout.write(f"  Ingredient count: {Ingredient.objects.count()}")
        self.stdout.write(f"  Purchase invoice PO: {Purchase.objects.count()}")
        self.stdout.write(f"  PurchaseItem count: {PurchaseItem.objects.count()}")
        self.stdout.write(f"  InventoryBatch count: {InventoryBatch.objects.count()}")
        self.stdout.write(f"  StockMovement logs: {StockMovement.objects.count()}")
        self.stdout.write(f"  Reservation bookings: {Reservation.objects.count()}")
        self.stdout.write(f"  ReservationTable links: {ReservationTable.objects.count()}")
        self.stdout.write(f"  ReservationHistory logs: {ReservationHistory.objects.count()}")
        self.stdout.write(f"  MenuItem count: {MenuItem.objects.count()}")
        self.stdout.write(f"  Order count: {Order.objects.count()}")
        self.stdout.write(f"  OrderItem count: {OrderItem.objects.count()}")
        self.stdout.write(f"  Invoice POS bill count: {Invoice.objects.count()}")
        self.stdout.write(f"  POSPayment transaction count: {POSPayment.objects.count()}")
        self.stdout.write(f"  CustomerReview count: {CustomerReview.objects.count()}")
        self.stdout.write(f"  ReviewInsight count: {ReviewInsight.objects.count()}")
        self.stdout.write(f"  ReputationSnapshot records: {ReputationSnapshot.objects.count()}")
        self.stdout.write(f"  WeeklyFeedbackSummary count: {WeeklyFeedbackSummary.objects.count()}")
        self.stdout.write("==================================================")
