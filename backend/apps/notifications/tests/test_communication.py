import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.core.models import Branch, Restaurant
from apps.notifications.models import (
    NotificationChannelSettings,
    EmailTemplate,
    CommunicationLog,
    Campaign,
    InAppNotification
)
from apps.notifications.services import (
    TemplateRenderService,
    CommunicationDispatchService,
    AICommunicationAssistantService
)
from django.contrib.auth import get_user_model
User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def sample_branch(db):
    restaurant = Restaurant.objects.create(
        name="API Diner",
        code="api-diner",
        contact_email="api@diner.com",
        contact_phone="+15005550006",
        address="API Road"
    )
    return Branch.objects.create(
        restaurant=restaurant,
        name="Communication Test Branch",
        branch_code="comm-test",
        address="Test Address"
    )

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="commmanager",
        email="manager@dinein.com",
        password="Password123!"
    )

@pytest.mark.django_db
def test_template_rendering():
    context = {
        'guest_name': 'John Doe',
        'booking_id': '12345',
        'party_size': 4,
        'start_time': '2026-07-10 19:30',
        'table_number': 'T5'
    }
    subject, html = TemplateRenderService.render('reservation_confirmation', context)
    
    assert "John Doe" in html
    assert "12345" in html
    assert "T5" in html
    assert "Reservation Request Received" in html

@pytest.mark.django_db
def test_email_dispatch_and_logging(db):
    context = {
        'guest_name': 'Jane Doe',
        'booking_id': '98765'
    }
    success = CommunicationDispatchService.send_email(
        recipient="jane@example.com",
        template_type="reservation_confirmation",
        context=context
    )
    
    assert success is True
    # Verify log was created
    log = CommunicationLog.objects.filter(recipient="jane@example.com").first()
    assert log is not None
    assert log.status == 'sent'
    assert "Jane Doe" in log.body

@pytest.mark.django_db
def test_communication_settings_api(api_client, manager_user, sample_branch):
    api_client.force_authenticate(user=manager_user)
    
    url = reverse('comm-settings-list')
    data = {
        'branch': str(sample_branch.id),
        'smtp_host': 'smtp.mailtrap.io',
        'smtp_port': 2525,
        'smtp_username': 'test-user',
        'smtp_password': 'test-password',
        'sms_provider': 'twilio',
        'sms_api_key': 'key123'
    }
    
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data['smtp_host'] == 'smtp.mailtrap.io'

@pytest.mark.django_db
def test_templates_crud_api(api_client, manager_user):
    api_client.force_authenticate(user=manager_user)
    url = reverse('comm-templates-list')
    
    data = {
        'name': 'birthday_wishes',
        'subject': 'Happy Birthday!',
        'body_html': '<h1>Happy Birthday {{guest_name}}!</h1>'
    }
    
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert EmailTemplate.objects.filter(name='birthday_wishes').exists()

@pytest.mark.django_db
def test_campaign_send_api(api_client, manager_user):
    api_client.force_authenticate(user=manager_user)
    
    # Create target customer
    from apps.authentication.models import Role
    cust_role, _ = Role.objects.get_or_create(code='customer', name='Customer')
    customer = User.objects.create_user(
        username="targetcustomer",
        email="customer@example.com",
        password="Password123!",
        role=cust_role
    )
    
    campaign = Campaign.objects.create(
        name="BOGO Coupon Campaign",
        subject="Buy 1 Get 1 Free Tonight!",
        content_html="<p>Get a free appetizer!</p>",
        audience_type="all",
        coupon_code="BOGO Appetizer"
    )
    
    url = reverse('comm-campaigns-send', args=[campaign.id])
    response = api_client.post(url, format='json')
    
    assert response.status_code == status.HTTP_200_OK
    campaign.refresh_from_db()
    assert campaign.status == 'completed'
    assert campaign.sent_count > 0

@pytest.mark.django_db
def test_ai_copywriting_api(api_client, manager_user):
    api_client.force_authenticate(user=manager_user)
    
    url = reverse('comm-campaigns-ai-generate')
    data = {'prompt_type': 'weekend_promo', 'guest_name': 'Mark'}
    
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert "data" in response.data
    assert "subject" in response.data['data']
