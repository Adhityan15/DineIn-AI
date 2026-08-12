import pytest
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from apps.core.models import Branch, Restaurant
from apps.reservation.models import Table, Reservation, Waitlist
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestReservationAPIs:

    @pytest.fixture
    def setup_api_data(self, test_user):
        restaurant = Restaurant.objects.create(
            name="API Diner",
            code="api-diner",
            contact_email="api@diner.com",
            contact_phone="+15005550006",
            address="API Road"
        )
        branch = Branch.objects.create(
            restaurant=restaurant,
            name="East Coast",
            branch_code="east-coast",
            address="East Ave"
        )
        
        t1 = Table.objects.create(branch=branch, number="Table A", capacity=2)
        t2 = Table.objects.create(branch=branch, number="Table B", capacity=4)
        
        return {
            "branch": branch,
            "user": test_user,
            "tables": [t1, t2]
        }

    def test_tables_list_endpoint(self, api_client, setup_api_data):
        # Authenticate client
        api_client.force_authenticate(user=setup_api_data["user"])
        
        url = reverse('table-list')
        response = api_client.get(url)
        branch_tables = [t for t in response.data if str(t['branch']) == str(setup_api_data['branch'].id)]
        assert len(branch_tables) == 2
        assert branch_tables[0]['number'] == "Table A"

    def test_booking_creation_and_actions(self, api_client, setup_api_data, admin_user):
        branch = setup_api_data["branch"]
        api_client.force_authenticate(user=setup_api_data["user"])
        start_time = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        url = reverse('booking-list')
        payload = {
            "branch": branch.id,
            "guest_name": "API Guest",
            "guest_phone": "+918888888888",
            "party_size": 2,
            "start_time": start_time.isoformat()
        }

        # 1. Create Booking (starts as pending)
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        booking_id = response.data['data']['id']
        assert response.data['data']['status'] == "pending"

        # Approve Action
        approve_url = reverse('booking-approve', args=[booking_id])
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(approve_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['status'] == "confirmed"

        # 2. Check In Action
        check_in_url = reverse('booking-check-in', args=[booking_id])
        response = api_client.post(check_in_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['status'] == "arrived"

        # Seat Action
        seat_url = reverse('booking-seat', args=[booking_id])
        response = api_client.post(seat_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['status'] == "seated"

        # 3. Check Out Action
        check_out_url = reverse('booking-check-out', args=[booking_id])
        response = api_client.post(check_out_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['status'] == "completed"

    def test_availability_checking_endpoint(self, api_client, setup_api_data):
        branch = setup_api_data["branch"]
        api_client.force_authenticate(user=setup_api_data["user"])
        start_time = timezone.now().replace(hour=19, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        url = reverse('availability')
        
        # 1. Check availability for party of 2 (Table A is available)
        response = api_client.get(url, {
            "branch": branch.id,
            "start_time": start_time.isoformat(),
            "party_size": 2
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['is_available'] is True
        assert len(response.data['data']['tables']) > 0

    def test_waitlist_joining_and_promotion(self, api_client, setup_api_data, admin_user):
        branch = setup_api_data["branch"]
        api_client.force_authenticate(user=setup_api_data["user"])
        
        # 1. Join waitlist
        url = reverse('waitlist-join')
        payload = {
            "branch": branch.id,
            "guest_name": "API Waiter",
            "guest_phone": "+918888888888",
            "party_size": 2
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        wait_id = response.data['data']['id']
        assert response.data['data']['position'] == 1

        # 2. Notify guest
        notify_url = reverse('waitlist-notify', args=[wait_id])
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(notify_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['status'] == "notified"

        # 3. Promote guest to Table A
        promote_url = reverse('waitlist-promote', args=[wait_id])
        table_a = Table.objects.get(branch=branch, number="Table A")
        response = api_client.post(promote_url, {"tables": [table_a.id]}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['status'] == "seated"
