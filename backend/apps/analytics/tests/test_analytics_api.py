import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.models import Branch, Restaurant
from apps.inventory.models import Ingredient, InventoryBatch

User = get_user_model()

@pytest.mark.django_db
class TestAIAnalyticsAPI:

    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.restaurant = Restaurant.objects.create(
            name="Analytics Rest",
            code="analytics-rest",
            contact_email="analytics@rest.com",
            contact_phone="+1234567890",
            address="Analytics Street"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Analytics Branch",
            branch_code="analytics-branch",
            address="Analytics Road",
            is_active=True
        )
        self.user = User.objects.create_user(
            username="analytics_user",
            email="analytics_user@example.com",
            password="password123"
        )
        self.ingredient = Ingredient.objects.create(
            name="Test Beef",
            category="meat",
            unit="kg",
            min_stock=10.0,
            max_stock=50.0
        )
        self.batch = InventoryBatch.objects.create(
            branch=self.branch,
            ingredient=self.ingredient,
            quantity=5.0,
            batch_number="B001",
            purchase_price=15.00,
            status="active"
        )

    def test_predictive_analytics_endpoint(self, api_client):
        api_client.force_authenticate(user=self.user)
        url = reverse('ai-analytics-predictive')
        
        # Test linear regression
        response = api_client.get(url, {'branch': str(self.branch.id), 'algorithm': 'linear_regression'})
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        
        assert "kpis" in data
        assert "sales_chart" in data
        assert "sentiment" in data
        assert "inventory_depletions" in data
        assert "customer_segmentation" in data
        
        # Verify kpis structure
        assert "revenue_forecast" in data["kpis"]
        assert "predicted_csat" in data["kpis"]
        assert "inventory_risk_count" in data["kpis"]
        assert data["kpis"]["inventory_risk_count"] == 1 # Since Test Beef quantity (5) <= min_stock (10)
        
        # Test moving average algorithm
        response_ma = api_client.get(url, {'branch': str(self.branch.id), 'algorithm': 'moving_average'})
        assert response_ma.status_code == status.HTTP_200_OK
        
        # Test polynomial regression algorithm
        response_poly = api_client.get(url, {'branch': str(self.branch.id), 'algorithm': 'polynomial'})
        assert response_poly.status_code == status.HTTP_200_OK
