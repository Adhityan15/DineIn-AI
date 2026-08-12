import os
import sys
sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")
django.setup()

from apps.inventory.models import MenuItem, Ingredient, Recipe, RecipeIngredient, InventoryBatch
from apps.reservation.models import Table
from apps.staff.models import Employee, Department, Designation
from apps.core.models import Branch, Restaurant
from django.contrib.auth import get_user_model

User = get_user_model()

print("Restaurant count:", Restaurant.objects.count())
print("Branch count:", Branch.objects.count())
print("Table count:", Table.objects.count())
print("Department count:", Department.objects.count())
print("Designation count:", Designation.objects.count())
print("Employee count:", Employee.objects.count())
print("User count:", User.objects.count())
print("MenuItem count:", MenuItem.objects.count())
print("Ingredient count:", Ingredient.objects.count())
print("Recipe count:", Recipe.objects.count())
print("RecipeIngredient count:", RecipeIngredient.objects.count())
print("InventoryBatch count:", InventoryBatch.objects.count())
