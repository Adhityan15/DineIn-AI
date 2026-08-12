import pytest
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from apps.core.models import Restaurant
from dinein_project.celery import app as celery_app
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_django_and_database_connection():
    """
    Verifies Django settings and transactional database access (SQLite in-memory) are working.
    """
    # Verify settings are loaded
    assert settings.DEBUG is False
    assert 'apps.core.apps.CoreConfig' in settings.INSTALLED_APPS
    
    # Verify database model insertion and query functionality
    restaurant = Restaurant.objects.create(
        name="Test DineIn",
        code="test-dinein",
        contact_email="test@dinein.com",
        contact_phone="+919876543210",
        address="123 Street Bengaluru"
    )
    assert Restaurant.objects.filter(code="test-dinein").exists()
    retrieved = Restaurant.objects.get(code="test-dinein")
    assert retrieved.name == "Test DineIn"


def test_celery_initialization():
    """
    Verifies Celery application is configured and autodiscovering tasks.
    """
    assert celery_app is not None
    assert celery_app.main == 'dinein_project'
    # Celery should read configurations from settings
    assert celery_app.conf.task_serializer == 'json'


@pytest.mark.django_db
def test_api_health_check_routing(api_client):
    """
    Verifies REST API routing, custom CoreJSONRenderer, and custom exceptions.
    """
    import json
    url = reverse('health_check')
    response = api_client.get(url)
    
    # Assert successful status and standardized envelope structure
    assert response.status_code == status.HTTP_200_OK
    
    # Load response.content to verify the CoreJSONRenderer output
    rendered_data = json.loads(response.content)
    assert rendered_data['success'] is True
    assert rendered_data['message'] == "Operation completed successfully."
    assert rendered_data['data']['status'] == "healthy"
    assert rendered_data['data']['service'] == "dinein-backend-api"


@pytest.mark.django_db
def test_jwt_token_generation_and_claims(test_user):
    """
    Verifies SimpleJWT token generation and custom claims mapping.
    """
    from apps.authentication.serializers import CustomTokenObtainPairSerializer
    
    # Create tokens for test user using our custom claims logic
    refresh = CustomTokenObtainPairSerializer.get_token(test_user)
    
    # Validate token claims structure
    assert refresh is not None
    assert 'email' in refresh
    assert refresh['email'] == test_user.email
    assert refresh['role'] == 'customer'
    
    access_token = refresh.access_token
    assert access_token is not None
    assert access_token['email'] == test_user.email
