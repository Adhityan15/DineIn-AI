# Pytest global fixtures configuration.
import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from apps.authentication.models import Role

@pytest.fixture(autouse=True)
def run_db_seeding(db):
    """
    Autouse fixture to seed default roles and permissions before every test.
    """
    call_command('seed_roles_permissions')

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def test_user(db):
    User = get_user_model()
    role_obj = Role.objects.get(code='customer')
    return User.objects.create_user(
        email="test@dinein.com",
        username="testuser",
        password="Testpassword123!", # Matches strong password rules
        first_name="Test",
        last_name="User",
        phone="+15005550006",
        role=role_obj
    )

@pytest.fixture
def admin_user(db):
    User = get_user_model()
    role_obj = Role.objects.get(code='admin')
    return User.objects.create_user(
        email="admin@dinein.com",
        username="adminuser",
        password="Adminpassword123!",
        first_name="Admin",
        last_name="User",
        phone="+15005550006",
        role=role_obj,
        is_staff=True,
        is_superuser=True
    )
