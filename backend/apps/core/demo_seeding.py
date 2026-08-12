import random
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.core.models import Restaurant, Branch
from apps.staff.models import Department, Designation, Employee
from apps.inventory.models import MenuItem, Ingredient, Recipe, RecipeIngredient, InventoryBatch
from apps.reservation.models import Table, Reservation, ReservationTable

User = get_user_model()

def seed_demo_data(branch_id=None):
    # 1. Get or create Restaurant
    restaurant, _ = Restaurant.objects.get_or_create(
        code="dinein-ai",
        defaults={
            "name": "DineIn AI Group",
            "contact_email": "group@dinein.ai",
            "contact_phone": "+15550199",
            "address": "1 Restaurant Plaza"
        }
    )

    # 2. Get or create Branch
    if branch_id:
        branch = Branch.objects.get(id=branch_id)
    else:
        branch = Branch.objects.first()
        if not branch:
            branch = Branch.objects.create(
                restaurant=restaurant,
                name="Main Bangalore Branch",
                branch_code="bangalore-main",
                latitude=Decimal("12.9716"),
                longitude=Decimal("77.5946"),
                geofence_radius=5000,
                address="100, MG Road, Bangalore",
                is_active=True,
                is_default=True,
                gst_number="29AAAAA1111A1Z1",
                tax_percentage=Decimal("5.00"),
                service_charge_percentage=Decimal("10.00")
            )

    # 3. Create Departments and Designations
    dept_service, _ = Department.objects.get_or_create(
        code="fb-service",
        defaults={"name": "F&B Service"}
    )
    dept_kitchen, _ = Department.objects.get_or_create(
        code="kitchen",
        defaults={"name": "Kitchen Operations"}
    )

    desig_waiter, _ = Designation.objects.get_or_create(
        name="Waiter",
        department=dept_service
    )
    desig_captain, _ = Designation.objects.get_or_create(
        name="Captain",
        department=dept_service
    )
    desig_chef, _ = Designation.objects.get_or_create(
        name="Head Chef",
        department=dept_kitchen
    )

    # 4. Create Waiters
    waiter_details = [
        {"name": "Waiter John", "email": "waiter.john@dinein.com", "username": "waiter_john", "emp_id": "EMP-001", "designation": desig_waiter},
        {"name": "Waiter Sara", "email": "waiter.sara@dinein.com", "username": "waiter_sara", "emp_id": "EMP-002", "designation": desig_waiter},
        {"name": "Captain Robert", "email": "capt.robert@dinein.com", "username": "capt_robert", "emp_id": "EMP-003", "designation": desig_captain},
    ]

    waiters_created = []
    for wd in waiter_details:
        names = wd["name"].split()
        first_name = names[0]
        last_name = names[1] if len(names) > 1 else ""
        user, created = User.objects.get_or_create(
            email=wd["email"],
            defaults={
                "username": wd["username"],
                "first_name": first_name,
                "last_name": last_name,
                "phone": "9999999999",
                "is_active": True,
                "branch": branch
            }
        )
        if created:
            user.set_password("Password123")
            user.save()

        employee = Employee.objects.filter(employee_id=wd["emp_id"]).first()
        if not employee:
            employee = Employee.objects.filter(user=user).first()
        if not employee:
            employee = Employee.objects.create(
                user=user,
                employee_id=wd["emp_id"],
                designation=wd["designation"],
                hire_date=timezone.now().date(),
                hourly_rate=Decimal("15.00"),
                status="active",
                skills="cashier, kitchen, waiter"
            )
        waiters_created.append(employee)

    # 5. Create Tables
    tables_created = []
    for i in range(1, 11):
        table, _ = Table.objects.get_or_create(
            branch=branch,
            number=str(i),
            defaults={
                "capacity": 4 if i <= 5 else 6,
                "status": "available"
            }
        )
        tables_created.append(table)

    # 6. Create Menu Categories & Menu Items
    menu_items_to_create = [
        # Starters
        {"name": "French Fries", "category": "Starters", "price": Decimal("3.99"), "prep_time": 8},
        {"name": "Veg Spring Roll", "category": "Starters", "price": Decimal("5.49"), "prep_time": 10},
        {"name": "Chicken 65", "category": "Starters", "price": Decimal("8.99"), "prep_time": 12},
        {"name": "Paneer Tikka", "category": "Starters", "price": Decimal("7.99"), "prep_time": 15},
        # Main Course
        {"name": "Chicken Biryani", "category": "Main Course", "price": Decimal("12.99"), "prep_time": 20},
        {"name": "Veg Biryani", "category": "Main Course", "price": Decimal("10.99"), "prep_time": 18},
        {"name": "Butter Chicken", "category": "Main Course", "price": Decimal("13.99"), "prep_time": 15},
        {"name": "Naan", "category": "Main Course", "price": Decimal("1.99"), "prep_time": 5},
        {"name": "Fried Rice", "category": "Main Course", "price": Decimal("9.49"), "prep_time": 12},
        {"name": "Noodles", "category": "Main Course", "price": Decimal("9.49"), "prep_time": 12},
        # Pizza
        {"name": "Margherita", "category": "Pizza", "price": Decimal("11.99"), "prep_time": 15},
        {"name": "Farmhouse", "category": "Pizza", "price": Decimal("13.99"), "prep_time": 15},
        {"name": "Pepperoni", "category": "Pizza", "price": Decimal("14.99"), "prep_time": 15},
        # Burger
        {"name": "Veg Burger", "category": "Burger", "price": Decimal("6.99"), "prep_time": 10},
        {"name": "Chicken Burger", "category": "Burger", "price": Decimal("7.99"), "prep_time": 11},
        # Desserts
        {"name": "Ice Cream", "category": "Desserts", "price": Decimal("3.49"), "prep_time": 3},
        {"name": "Brownie", "category": "Desserts", "price": Decimal("4.99"), "prep_time": 6},
        {"name": "Cheese Cake", "category": "Desserts", "price": Decimal("5.99"), "prep_time": 5},
        # Beverages
        {"name": "Coke", "category": "Beverages", "price": Decimal("1.99"), "prep_time": 2},
        {"name": "Sprite", "category": "Beverages", "price": Decimal("1.99"), "prep_time": 2},
        {"name": "Pepsi", "category": "Beverages", "price": Decimal("1.99"), "prep_time": 2},
        {"name": "Coffee", "category": "Beverages", "price": Decimal("2.49"), "prep_time": 4},
        {"name": "Tea", "category": "Beverages", "price": Decimal("1.99"), "prep_time": 4},
        {"name": "Fresh Lime", "category": "Beverages", "price": Decimal("2.99"), "prep_time": 5},
        # Mapped aliases for test suite back-compatibility
        {"name": "Margherita Pizza", "category": "Pizza", "price": Decimal("12.00"), "prep_time": 15},
        {"name": "Pepperoni Pizza", "category": "Pizza", "price": Decimal("14.99"), "prep_time": 15},
        {"name": "Cheese Burger", "category": "Burger", "price": Decimal("8.50"), "prep_time": 12},
    ]

    menu_items_created = {}
    for mi in menu_items_to_create:
        slug = mi["name"].lower().replace(" ", "-")
        item, _ = MenuItem.objects.get_or_create(
            name=mi["name"],
            defaults={
                "category": mi["category"],
                "price": mi["price"],
                "prep_time": mi["prep_time"],
                "is_active": True,
                "sku": f"SKU-{slug.upper()}",
                "barcode": f"BAR-{slug.upper()}",
                "kitchen_station": "Pizza Station" if mi["category"] == "Pizza" else "Main Kitchen",
                "is_available": True
            }
        )
        menu_items_created[mi["name"]] = item

    # 7. Create Ingredients
    ingredients_to_create = [
        {"name": "Pizza Dough", "unit": "kg", "min_stock": Decimal("10.00")},
        {"name": "Mozzarella Cheese", "unit": "kg", "min_stock": Decimal("5.00")},
        {"name": "Pepperoni Slices", "unit": "kg", "min_stock": Decimal("2.00")},
        {"name": "Beef Patty", "unit": "pcs", "min_stock": Decimal("20.00")},
        {"name": "Burger Buns", "unit": "pcs", "min_stock": Decimal("30.00")},
        {"name": "Fresh Oranges", "unit": "pcs", "min_stock": Decimal("50.00")},
    ]

    ingredients_created = {}
    for ing in ingredients_to_create:
        item, _ = Ingredient.objects.get_or_create(
            name=ing["name"],
            defaults={
                "unit": ing["unit"],
                "min_stock": ing["min_stock"],
                "max_stock": ing["min_stock"] * 5
            }
        )
        ingredients_created[ing["name"]] = item

    # 8. Create Recipes and RecipeIngredients
    # Margherita Pizza
    m_recipe, _ = Recipe.objects.get_or_create(menu_item=menu_items_created["Margherita Pizza"], name="Standard Margherita")
    RecipeIngredient.objects.get_or_create(recipe=m_recipe, ingredient=ingredients_created["Pizza Dough"], defaults={"quantity": Decimal("0.25")})
    RecipeIngredient.objects.get_or_create(recipe=m_recipe, ingredient=ingredients_created["Mozzarella Cheese"], defaults={"quantity": Decimal("0.20")})

    # Pepperoni Pizza
    p_recipe, _ = Recipe.objects.get_or_create(menu_item=menu_items_created["Pepperoni Pizza"], name="Standard Pepperoni")
    RecipeIngredient.objects.get_or_create(recipe=p_recipe, ingredient=ingredients_created["Pizza Dough"], defaults={"quantity": Decimal("0.25")})
    RecipeIngredient.objects.get_or_create(recipe=p_recipe, ingredient=ingredients_created["Mozzarella Cheese"], defaults={"quantity": Decimal("0.20")})
    RecipeIngredient.objects.get_or_create(recipe=p_recipe, ingredient=ingredients_created["Pepperoni Slices"], defaults={"quantity": Decimal("0.10")})

    # Cheese Burger
    c_recipe, _ = Recipe.objects.get_or_create(menu_item=menu_items_created["Cheese Burger"], name="Standard Cheese Burger")
    RecipeIngredient.objects.get_or_create(recipe=c_recipe, ingredient=ingredients_created["Beef Patty"], defaults={"quantity": Decimal("1.00")})
    RecipeIngredient.objects.get_or_create(recipe=c_recipe, ingredient=ingredients_created["Burger Buns"], defaults={"quantity": Decimal("1.00")})
    RecipeIngredient.objects.get_or_create(recipe=c_recipe, ingredient=ingredients_created["Mozzarella Cheese"], defaults={"quantity": Decimal("0.05")})

    # 9. Create Inventory Batches (FEFO support)
    # Give all ingredients active batches of quantity 100.00
    for name, ing in ingredients_created.items():
        InventoryBatch.objects.get_or_create(
            branch=branch,
            ingredient=ing,
            batch_number=f"BATCH-{random.randint(1000, 9999)}",
            defaults={
                "quantity": Decimal("100.00"),
                "purchase_price": Decimal("5.00"),
                "expiry_date": timezone.now().date() + timezone.timedelta(days=30),
                "status": "active"
            }
        )

    # 10. Create Seated Reservation on Table 1
    # Customer User
    customer_user, _ = User.objects.get_or_create(
        email="alice.smith@example.com",
        defaults={
            "username": "alice_smith",
            "first_name": "Alice",
            "last_name": "Smith",
            "phone": "9876543210",
            "is_active": True,
            "branch": branch
        }
    )
    
    # Check-in reservation
    reservation, _ = Reservation.objects.get_or_create(
        branch=branch,
        guest_name="Alice Smith",
        guest_phone="9876543210",
        defaults={
            "customer": customer_user,
            "guest_email": "alice.smith@example.com",
            "party_size": 4,
            "start_time": timezone.now(),
            "end_time": timezone.now() + timezone.timedelta(hours=2),
            "status": "seated",
            "waiter": waiters_created[0].user # Assign John
        }
    )

    # Link Table 1 to this reservation and mark table occupied
    table1 = tables_created[0]
    table1.status = "occupied"
    table1.save()
    
    ReservationTable.objects.get_or_create(
        reservation=reservation,
        table=table1
    )

    return branch
