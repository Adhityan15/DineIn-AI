import datetime
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.authentication.models import Role
from apps.core.models import Restaurant, Branch, Notification
from apps.reservation.models import Reservation, Table, ReservationTable
from apps.inventory.models import Ingredient, InventoryBatch, StockMovement, Purchase, PurchaseItem, MenuItem, Vendor
from apps.staff.models import Department, Designation, Employee, Shift, Schedule, Attendance, PerformanceReview, EmployeeAvailability, PayrollSummary
from apps.feedback.models import TopicCategory, SentimentKeyword, CustomerReview, ReviewInsight, ReputationSnapshot, AIRecommendation, WeeklyFeedbackSummary

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with a complete, realistic operational dataset for demonstration mode."

    def handle(self, *args, **options):
        self.stdout.write("Initializing Demo Mode seeding...")

        self.stdout.write("Cleaning up existing operational data...")
        Purchase.objects.all().delete()
        StockMovement.objects.all().delete()
        InventoryBatch.objects.all().delete()
        CustomerReview.objects.all().delete()
        ReviewInsight.objects.all().delete()
        ReputationSnapshot.objects.all().delete()
        WeeklyFeedbackSummary.objects.all().delete()
        Schedule.objects.all().delete()
        Attendance.objects.all().delete()
        EmployeeAvailability.objects.all().delete()
        PayrollSummary.objects.all().delete()
        PerformanceReview.objects.all().delete()
        from apps.notifications.models import WhatsAppTemplate
        WhatsAppTemplate.objects.all().delete()

        # 1. Setup Restaurant & Branch
        restaurant, _ = Restaurant.objects.get_or_create(
            code="test-dinein",
            defaults={
                "name": "DineIn Main Group",
                "contact_email": "owner@dinein.com",
                "contact_phone": "+15005550006",
                "address": "123 Main St"
            }
        )
        branch, _ = Branch.objects.get_or_create(
            branch_code="bangalore-main",
            defaults={
                "restaurant": restaurant,
                "name": "Bangalore Main",
                "latitude": 12.971598,
                "longitude": 77.594562,
                "geofence_radius": 100,
                "address": "456 Side St, Bangalore, India"
            }
        )

        # 2. Setup standard tables
        for i in range(1, 13):
            Table.objects.get_or_create(
                number=f"T{i}",
                defaults={
                    "branch": branch,
                    "capacity": 2 if i <= 4 else (4 if i <= 10 else 8),
                    "status": "available"
                }
            )
        tables = list(Table.objects.filter(branch=branch))

        # 3. Setup Staff Roles, Departments, and Designations
        roles = {r.code: r for r in Role.objects.all()}
        manager_role = roles.get('manager')
        staff_role = roles.get('kitchen_staff')
        customer_role = roles.get('customer')

        dept_kitchen, _ = Department.objects.get_or_create(code="kitchen", defaults={"name": "Kitchen"})
        dept_service, _ = Department.objects.get_or_create(code="service", defaults={"name": "Service"})

        desig_chef = Designation.objects.filter(name="Chef", department=dept_kitchen).first()
        if not desig_chef:
            desig_chef = Designation.objects.create(name="Chef", department=dept_kitchen)

        desig_waiter = Designation.objects.filter(name="Server", department=dept_service).first()
        if not desig_waiter:
            desig_waiter = Designation.objects.create(name="Server", department=dept_service)

        # Create Shift operational pattern
        shift_morning, _ = Shift.objects.get_or_create(
            name="Morning Service",
            defaults={"start_time": "08:00:00", "end_time": "16:00:00"}
        )
        shift_evening, _ = Shift.objects.get_or_create(
            name="Evening Cook",
            defaults={"start_time": "16:00:00", "end_time": "00:00:00"}
        )

        # 4. Generate 100+ Employees
        self.stdout.write("Generating 100+ operational employees...")
        first_names = ["Arjun", "Neha", "Rohan", "Pooja", "Vikram", "Ananya", "Rahul", "Kavya", "Deepak", "Aditi", "John", "Sarah", "Jane", "Marcus"]
        last_names = ["Kumar", "Sharma", "Mehta", "Patel", "Singh", "Nair", "Das", "Joshi", "Iyer", "Sen", "Miller", "Connor", "Doe", "Aurelius"]
        
        employees = []
        today_date = datetime.date.today()
        
        for i in range(105):
            email = f"emp{i}@dinein.com"
            username = f"emp_user_{i}"
            user_obj, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": username,
                    "first_name": random.choice(first_names),
                    "last_name": random.choice(last_names),
                    "phone": f"+919876543{i:03d}",
                    "role": staff_role if i > 5 else manager_role,
                    "branch": branch
                }
            )
            if not user_obj.check_password("Password123!"):
                user_obj.set_password("Password123!")
                user_obj.save()

            emp, _ = Employee.objects.get_or_create(
                user=user_obj,
                defaults={
                    "employee_id": f"EMP-{i:03d}",
                    "designation": desig_chef if i % 2 == 0 else desig_waiter,
                    "skills": "cashier, kitchen, safety" if i % 2 == 0 else "service, customer, checkout",
                    "status": "active",
                    "hire_date": today_date,
                    "hourly_rate": 15.00
                }
            )
            employees.append(emp)

        # Roster schedules and mock attendance entries
        self.stdout.write("Rostering shift attendance logs...")
        for idx, emp in enumerate(employees[:45]):
            sched, _ = Schedule.objects.get_or_create(
                employee=emp,
                date=today_date,
                shift=shift_morning if idx % 2 == 0 else shift_evening
            )
            # Create matching attendance log
            Attendance.objects.get_or_create(
                employee=emp,
                date=today_date,
                defaults={
                    "clock_in": timezone.now() - datetime.timedelta(hours=random.randint(2, 6)),
                    "clock_out": timezone.now(),
                    "clock_in_latitude": 12.971598,
                    "clock_in_longitude": 77.594562,
                    "status": "present" if idx % 4 != 0 else "late",
                    "is_anomaly": False
                }
            )

        # Pre-generate PerformanceReviews to store burnout scores
        self.stdout.write("Generating performance reviews with burnout statistics...")
        for emp in employees:
            PerformanceReview.objects.create(
                employee=emp,
                reviewer=employees[0],
                review_date=today_date,
                score=random.randint(3, 5),
                feedback="Good performance score.",
                burnout_risk=random.uniform(10.0, 85.0)
            )

        # 5. Generate 200+ Reservations
        self.stdout.write("Generating 200+ table reservations...")
        customer_users = []
        for i in range(10):
            cust_email = f"cust{i}@dinein.com"
            c_user, _ = User.objects.get_or_create(
                email=cust_email,
                defaults={
                    "username": f"cust_user_{i}",
                    "role": customer_role,
                    "first_name": f"Customer_{i}",
                    "last_name": "Portal",
                    "branch": branch
                }
            )
            customer_users.append(c_user)

        res_statuses = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"]
        for i in range(215):
            days_offset = random.randint(-15, 15)
            hours_offset = random.randint(11, 22)
            minutes_offset = random.choice([0, 30])
            
            res_datetime = timezone.now() + datetime.timedelta(days=days_offset)
            res_datetime = res_datetime.replace(hour=hours_offset, minute=minutes_offset, second=0, microsecond=0)
            
            res = Reservation.objects.create(
                branch=branch,
                customer=random.choice(customer_users),
                guest_name=f"Guest Book {i}",
                guest_phone=f"+919900112{i:03d}",
                guest_email=f"guest{i}@gmail.com",
                party_size=random.randint(2, 6),
                start_time=res_datetime,
                end_time=res_datetime + datetime.timedelta(hours=2),
                status=random.choice(res_statuses),
                notes="Wheelchair access" if i % 10 == 0 else "",
                is_walk_in=(i % 5 == 0)
            )
            # Link table mapping
            ReservationTable.objects.create(
                reservation=res,
                table=random.choice(tables)
            )

        # 6. Generate 500+ Inventory Transactions
        self.stdout.write("Generating 500+ inventory batches and movements...")
        
        # Pre-create Vendors
        vendors = []
        for i in range(5):
            vendor, _ = Vendor.objects.get_or_create(
                name=f"Supplier Group {i}",
                defaults={
                    "contact_name": f"Supplier Contact {i}",
                    "phone": f"+91880011220{i}",
                    "email": f"supplier{i}@gmail.com",
                    "address": f"Factory Lane {i}, Bangalore",
                    "performance_score": random.uniform(85.0, 100.0)
                }
            )
            vendors.append(vendor)

        ingredients_seed = [
            ("Basmati Rice", "dry_goods", 100, 2.5),
            ("Chicken Breast", "meat", 50, 6.0),
            ("Cooking Oil", "others", 80, 3.2),
            ("Tomatoes", "vegetables", 40, 1.8),
            ("Onions", "vegetables", 60, 1.2),
            ("Garlic", "vegetables", 20, 4.0),
            ("Yogurt", "dairy", 30, 2.0),
            ("Spice Masala", "spices", 25, 8.5)
        ]

        ingredient_objects = []
        ingredient_prices = {}
        for name, cat, min_limit, price in ingredients_seed:
            ing, _ = Ingredient.objects.get_or_create(
                name=name,
                defaults={
                    "category": cat,
                    "unit": "kg" if cat != "others" else "L",
                    "min_stock": min_limit,
                    "max_stock": min_limit * 3,
                    "abc_class": "A" if price >= 5.0 else ("B" if price >= 2.0 else "C")
                }
            )
            ingredient_objects.append(ing)
            ingredient_prices[ing.id] = price

        # Mock POS menu items mapping
        MenuItem.objects.get_or_create(name="Chicken Biryani", defaults={"price": 12.50, "is_active": True})
        MenuItem.objects.get_or_create(name="Garden Salad", defaults={"price": 6.50, "is_active": True})

        # Generate purchases and transactions
        for i in range(65):
            purchase = Purchase.objects.create(
                branch=branch,
                vendor=random.choice(vendors),
                invoice_no=f"INV-{i:04d}",
                purchase_date=today_date - datetime.timedelta(days=random.randint(1, 15))
            )
            for ing in random.sample(ingredient_objects, 3):
                qty = random.randint(10, 50)
                price = ingredient_prices[ing.id]
                batch_number = f"BAT-{random.randint(1000, 9999)}"
                expiry_date = today_date + datetime.timedelta(days=random.randint(5, 30))

                # Create item line
                item = PurchaseItem.objects.create(
                    purchase=purchase,
                    ingredient=ing,
                    quantity=qty,
                    purchase_unit="kg",
                    unit_price=price,
                    batch_number=batch_number,
                    expiry_date=expiry_date
                )
                # Create batch
                batch = InventoryBatch.objects.create(
                    branch=branch,
                    ingredient=ing,
                    quantity=qty - random.randint(5, 10),
                    batch_number=batch_number,
                    purchase_price=price,
                    expiry_date=expiry_date,
                    status="active"
                )
                # Record Stock movement
                StockMovement.objects.create(
                    branch=branch,
                    ingredient=ing,
                    batch=batch,
                    quantity=qty,
                    movement_type="purchase",
                    description=f"Received batch {batch.batch_number} from invoice {purchase.invoice_no}"
                )

        # 7. Generate 1000+ Customer Reviews & Insights
        self.stdout.write("Generating 1000+ customer feedback records...")
        review_comments = [
            ("The Biryani was exceptionally well prepared, steaming hot, and perfectly spiced. Great food quality!", 5, "positive", "Happy", ["Food Quality"], ["biryani", "spiced", "delicious"]),
            ("Extremely frustrated! We waited for 45 minutes to get our food. Cold fries and slow waiters.", 1, "negative", "Frustrated", ["Waiting Time", "Service"], ["wait", "delay", "cold fries"]),
            ("Disappointed with my visit. I found a hair in my salad! Staff behavior was cold.", 1, "negative", "Disappointed", ["Cleanliness", "Staff Behaviour"], ["dirty", "hair", "rude"]),
            ("Very nice ambience, great music volume, and clean tables. Friendly staff behavior.", 4, "positive", "Happy", ["Ambience", "Cleanliness", "Staff Behaviour"], ["clean", "music", "decor"]),
            ("Average food quality. Waiting time was acceptable, but nothing special to mention.", 3, "neutral", "Neutral", ["Overall Experience", "Waiting Time"], ["average", "wait"]),
            ("Warning: I had a severe allergen issue with peanuts in sauce. Neglected by hostess.", 1, "negative", "Angry", ["Overall Experience", "Service"], ["allergy", "allergen", "worst"]),
            ("Excellent quick service! Table 4 experience was flawless. Price was reasonable.", 5, "positive", "Excited", ["Reservation Experience", "Pricing"], ["quick", "cheap", "perfect"]),
            ("Happy with food, but pricing is high. Good quality onions and garnish.", 4, "positive", "Happy", ["Pricing", "Food Quality"], ["price", "pricey", "delicious"])
        ]

        # Bulk create Reviews
        reviews_to_create = []
        for i in range(1010):
            comment_pack = random.choice(review_comments)
            rev_date = today_date - datetime.timedelta(days=random.randint(0, 14))
            
            review = CustomerReview(
                branch=branch,
                author_name=f"Patron Marcus {i}",
                source='google_maps' if i % 2 == 0 else 'internal',
                rating=comment_pack[1],
                comment=comment_pack[0],
                visit_date=rev_date,
                external_review_id=f"google_maps_demo_{i}" if i % 2 == 0 else None,
                is_analyzed=True,
                priority_score=(6 - comment_pack[1]) * 15.0 + (15.0 if comment_pack[3] in ['Angry', 'Frustrated'] else 0.0),
                sentiment=comment_pack[2],
                confidence_score=0.95 if comment_pack[2] in ['positive', 'negative'] else 0.5
            )
            reviews_to_create.append((review, comment_pack))

        # Save reviews in database
        for rev, pack in reviews_to_create:
            rev.save()
            # Save related insights
            insight = ReviewInsight.objects.create(
                review=rev,
                sentiment=pack[2],
                sentiment_score=0.95 if pack[2] == 'positive' else (-0.95 if pack[2] == 'negative' else 0.0),
                emotion=pack[3],
                positive_keywords=pack[5] if pack[2] == 'positive' else [],
                negative_keywords=pack[5] if pack[2] == 'negative' else [],
                ai_summary=pack[0][:80] + "...",
                manager_action_items=["Review kitchen prep queue" if pack[2] == 'negative' else "Continue standard procedures"]
            )
            
            # Map topics
            for topic_name in pack[4]:
                slug = topic_name.lower().replace(' ', '_')
                topic_obj, _ = TopicCategory.objects.get_or_create(code=slug, defaults={"name": topic_name})
                insight.topics.add(topic_obj)
                rev.categories.add(topic_obj)

        # 8. Pre-generate past 14 days Reputation Snapshot timeline metrics
        self.stdout.write("Generating reputation trend snapshots...")
        for days_back in range(14, -1, -1):
            snap_date = today_date - datetime.timedelta(days=days_back)
            ReputationSnapshot.objects.create(
                branch=branch,
                date=snap_date,
                reputation_score=random.uniform(85.0, 94.0) if days_back > 5 else random.uniform(88.0, 96.0),
                rating_avg=random.uniform(4.1, 4.6),
                sentiment_index=random.uniform(70.0, 85.0),
                nps_score=random.uniform(60.0, 75.0),
                total_reviews=250 + (14 - days_back) * 20
            )

        # Seed EmployeeAvailability
        self.stdout.write("Generating employee availability rules...")
        for idx, emp in enumerate(employees[:20]):
            EmployeeAvailability.objects.create(
                employee=emp,
                available_from=today_date - datetime.timedelta(days=30),
                available_to=today_date + datetime.timedelta(days=30),
                status="available" if idx % 5 != 0 else "unavailable",
                remarks="Available Monday-Friday" if idx % 5 != 0 else "Unavailable 23 Jul-24 Jul"
            )

        # Seed PayrollSummary
        self.stdout.write("Generating payroll summaries...")
        for emp in employees[:20]:
            PayrollSummary.objects.create(
                employee=emp,
                month="2026-07",
                working_days=random.randint(20, 26),
                working_hours=random.randint(160, 208),
                overtime_hours=random.randint(5, 20),
                leave_days=random.randint(0, 3)
            )

        # Seed WeeklyFeedbackSummary
        self.stdout.write("Generating weekly feedback summaries...")
        for week_idx in range(4):
            w_start = today_date - datetime.timedelta(days=7 * (week_idx + 1))
            w_end = w_start + datetime.timedelta(days=6)
            WeeklyFeedbackSummary.objects.create(
                week_start=w_start,
                week_end=w_end,
                total_reviews=random.randint(100, 150),
                positive_reviews=random.randint(60, 90),
                neutral_reviews=random.randint(10, 30),
                negative_reviews=random.randint(10, 30),
                average_rating=random.uniform(4.0, 4.5),
                top_category="Food Quality",
                trending_metric="Weekly review growth: +15%"
            )

        # 9. Create static system recommendations & notifications
        AIRecommendation.objects.create(
            branch=branch,
            recommendation_type="menu",
            content="Chicken Biryani displays exceptional customer taste satisfaction. Consider featuring as high-lighted recommendation.",
            impact_score=8
        )
        AIRecommendation.objects.create(
            branch=branch,
            recommendation_type="service",
            content="Peak waiting time is clustered on Friday evenings. Roster 2 additional service staff to optimize guest coverage.",
            impact_score=9
        )
        
        Notification.objects.create(
            recipient_email=restaurant.contact_email,
            notification_type="system",
            title="Burnout Warning: Chef Arjun at 85%",
            message="Burnout metric flags Chef Arjun exceeding shift limits. Recommending schedule swap.",
            status="pending"
        )

        # 10. Seed WhatsApp templates
        templates_to_seed = [
            {
                "code": "reservation_confirmation",
                "name": "Reservation Confirmation",
                "body_template": "Reservation Confirmed: Dear {{guest_name}}, your table booking at {{branch_name}} for {{start_time}} is confirmed."
            },
            {
                "code": "reservation_reminder",
                "name": "Reservation Reminder",
                "body_template": "Reservation Reminder: Dear {{guest_name}}, your booking is scheduled at {{start_time}}. See you soon!"
            },
            {
                "code": "reservation_cancelled",
                "name": "Reservation Cancelled",
                "body_template": "Reservation Cancelled: Dear {{guest_name}}, your booking request at {{branch_name}} has been cancelled."
            },
            {
                "code": "order_confirmation",
                "name": "Order Confirmation",
                "body_template": "Thank you for your order! Your Order #{{order_id}} has been confirmed for {{customer_name}}."
            },
            {
                "code": "order_ready",
                "name": "Order Ready to Serve",
                "body_template": "Hi {{customer_name}}, your Order #{{order_id}} is ready to serve! Enjoy your meal."
            },
            {
                "code": "order_delivered",
                "name": "Order Delivered",
                "body_template": "Hi {{customer_name}}, your Order #{{order_id}} has been delivered. Thank you for dining with us!"
            },
            {
                "code": "low_stock_alert",
                "name": "Low Stock Alert",
                "body_template": "Urgent Alert: Ingredient {{ingredient_name}} at branch {{branch_name}} has reached low stock levels. Please reorder."
            },
            {
                "code": "leave_status_update",
                "name": "Leave Status Update",
                "body_template": "Hi {{employee_name}}, your leave request from {{start_date}} to {{end_date}} has been {{status}}."
            },
            {
                "code": "attendance_clock_in",
                "name": "Attendance Clock In",
                "body_template": "Hello {{employee_name}}, you clocked in successfully at {{time}}."
            },
            {
                "code": "attendance_clock_out",
                "name": "Attendance Clock Out",
                "body_template": "Hello {{employee_name}}, you clocked out successfully at {{time}}."
            },
            {
                "code": "new_announcement",
                "name": "New Announcement Alert",
                "body_template": "New Announcement from {{sender}}: {{title}}. Please check your notification center."
            }
        ]

        for t in templates_to_seed:
            WhatsAppTemplate.objects.create(
                branch=branch,
                code=t["code"],
                name=t["name"],
                body_template=t["body_template"],
                placeholders_list=[],
                is_active=True
            )

        self.stdout.write(self.style.SUCCESS("Demo Mode database successfully populated immediately!"))
