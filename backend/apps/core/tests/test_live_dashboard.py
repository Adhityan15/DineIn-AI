import pytest
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from decimal import Decimal
from apps.core.models import Branch, Invoice, Restaurant
from apps.inventory.models import Ingredient, MenuItem, Recipe, RecipeIngredient, InventoryBatch, Wastage, Consumption, Order, OrderItem
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def enterprise_setup(db):
    restaurant = Restaurant.objects.create(name="Enterprise Diner LLC", code="enterprise-diner-llc")
    branch = Branch.objects.create(
        restaurant=restaurant,
        name="Bangalore Flagship",
        branch_code="bangalore-flagship"
    )
    user = User.objects.create_user(
        email="ceo@diner.com",
        username="ceo_user",
        password="password123",
        branch=branch
    )
    return user, branch

@pytest.mark.django_db
def test_owner_dashboard_live_kpis(api_client, enterprise_setup):
    user, branch = enterprise_setup
    api_client.force_authenticate(user=user)
    
    # 1. Create a paid invoice to register revenue
    Invoice.objects.create(
        branch=branch,
        subtotal=Decimal('100.00'),
        total=Decimal('115.00'),
        status='paid',
        payment_method='upi'
    )
    
    url = reverse('owner-dashboard')
    res = api_client.get(url)
    assert res.status_code == status.HTTP_200_OK
    assert res.data['success'] is True
    assert 'metrics' in res.data['data']
    assert 'branches' in res.data['data']
    
    metrics = res.data['data']['metrics']
    assert metrics['companyRevenue'] != "$0"
    assert len(res.data['data']['branches']) >= 1

@pytest.mark.django_db
def test_sales_performance_trends(api_client, enterprise_setup):
    user, branch = enterprise_setup
    api_client.force_authenticate(user=user)
    
    url = reverse('sales-performance')
    res = api_client.get(url)
    assert res.status_code == status.HTTP_200_OK
    assert 'trends' in res.data['data']
    assert 'meal_periods' in res.data['data']
    assert 'table_areas' in res.data['data']
