from django.core.management.base import BaseCommand
from apps.core.demo_seeding import seed_demo_data

class Command(BaseCommand):
    help = "Seed realistic F&B POS datasets (Waiters, Menus, Recipes, Inventory Batches, seated reservations)"

    def handle(self, *args, **options):
        self.stdout.write("Initializing F&B POS database seeding...")
        branch = seed_demo_data()
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded demo datasets for branch: {branch.name} ({branch.branch_code})"))
