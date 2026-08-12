import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.authentication.models import Role
from apps.core.models import Restaurant, Branch, Invoice
from apps.reservation.models import Reservation

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def copilot_test_data(db):
    User = get_user_model()
    role_obj = Role.objects.get(code='manager')
    user = User.objects.create_user(
        email="manager_copilot@dinein.com",
        username="copilotmanager",
        password="Managerpassword123!",
        first_name="Copilot",
        last_name="Manager",
        phone="+15005550007",
        role=role_obj
    )
    
    restaurant, _ = Restaurant.objects.get_or_create(
        code="test-copilot",
        defaults={
            "name": "Copilot DineIn",
            "contact_email": "owner_cop@dinein.com",
            "contact_phone": "+15005550007",
            "address": "123 main"
        }
    )
    
    branch, _ = Branch.objects.get_or_create(
        branch_code="copilot-branch",
        defaults={
            "restaurant": restaurant,
            "name": "Copilot Branch",
            "address": "456 Side"
        }
    )
    
    user.branch = branch
    user.save()
    
    from apps.reservation.models import Table
    Table.objects.create(
        branch=branch,
        number="10",
        capacity=6,
        status="available"
    )
    
    return user, branch

@pytest.mark.django_db
class TestCopilotAPI:
    def test_copilot_chat_fallback(self, api_client, copilot_test_data):
        """
        Verify that when no Gemini API key is active, copilot defaults to rule-based fallback successfully.
        """
        user, branch = copilot_test_data
        api_client.force_authenticate(user=user)
        
        # Test navigation trigger matching "kitchen" keywords
        url = reverse('feedback:copilot-chat')
        data = {
            "message": "Open delayed kitchen orders tab",
            "active_branch_id": str(branch.id)
        }
        
        response = api_client.post(url, data, format='json', HTTP_X_BRANCH_ID=str(branch.id))
        assert response.status_code == status.HTTP_200_OK
        
        res_json = response.json()
        data = res_json.get("data", res_json)
        assert data["intent"] == "kitchen"
        assert "live" in data["navigate"]
        assert "Fallback" in data["thinking_steps"][0]

    @patch('requests.post')
    def test_copilot_chat_gemini_success(self, mock_post, api_client, copilot_test_data):
        """
        Verify that a mock successful Gemini response correctly parses parameters and executes service layers.
        """
        user, branch = copilot_test_data
        api_client.force_authenticate(user=user)
        
        # Mock Response from Gemini returning structured reservation JSON
        mock_response = mock_post.return_value
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": '{"intent": "reservations", "action": "create", "confidence": 0.95, "parameters": {"guest_name": "Jane Doe", "guest_phone": "+919994795959", "party_size": 4, "start_time": "2026-08-07T19:00:00Z"}, "reply": "Booking Table", "navigate": null, "widget": null, "thinking_steps": [], "requires_confirmation": false}'
                    }]
                }
            }]
        }
        
        # Set settings API key to trigger Gemini call
        from django.conf import settings
        settings.GEMINI_API_KEY = "test-active-api-key"
        
        url = reverse('feedback:copilot-chat')
        data = {
            "message": "Book tomorrow for 4 people under Jane Doe",
            "active_branch_id": str(branch.id)
        }
        
        response = api_client.post(url, data, format='json', HTTP_X_BRANCH_ID=str(branch.id))
        assert response.status_code == status.HTTP_200_OK
        
        res_json = response.json()
        data_res = res_json.get("data", res_json)
        assert data_res["intent"] == "reservations"
        assert data_res["widget"]["type"] == "reservation"
        assert data_res["widget"]["data"]["guest_name"] == "Jane Doe"
        
        # Clean settings key
        settings.GEMINI_API_KEY = ""
