import pytest
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from apps.core.models import Branch, Restaurant
from apps.reservation.models import Table, Reservation, ReservationTable, ReservationHistory
from apps.reservation.services import ReservationService, NotificationService
from apps.reservation.tasks import send_booking_reminders

User = get_user_model()

@pytest.fixture
def setup_features_data(db):
    restaurant = Restaurant.objects.create(
        name="Test Eats",
        code="test-eats-uptown",
        contact_email="test@eats.com",
        contact_phone="+15005550006",
        address="Test Address"
    )
    branch = Branch.objects.create(
        restaurant=restaurant,
        name="Test Eats - Uptown",
        branch_code="uptown",
        address="Uptown Street 10"
    )
    
    t1 = Table.objects.create(branch=branch, number="Table 1", capacity=2, status="available", x_coord=100, y_coord=100)
    t2 = Table.objects.create(branch=branch, number="Table 2", capacity=4, status="available", x_coord=200, y_coord=200)

    from apps.authentication.models import Role
    receptionist_role = Role.objects.get(code='receptionist')
    customer_role = Role.objects.get(code='customer')
    staff_user = User.objects.create_user(username="staff", email="staff@dinein.com", password="Password123!", role=receptionist_role)
    customer_user = User.objects.create_user(username="customer", email="cust@dinein.com", password="Password123!", role=customer_role)
    
    return {
        "branch": branch,
        "tables": [t1, t2],
        "staff": staff_user,
        "customer": customer_user,
    }

@pytest.mark.django_db
class TestNewReservationFeatures:
    
    def test_reservation_creation_and_approval_flow(self, setup_features_data):
        branch = setup_features_data["branch"]
        cust = setup_features_data["customer"]
        staff = setup_features_data["staff"]
        
        start_time = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        # 1. Create reservation (defaults to pending in API context, but let's test service pending creation)
        res = ReservationService.create_reservation(
            branch_id=branch.id,
            guest_name="Pending Guest",
            guest_phone="+918888888888",
            guest_email="pending@test.com",
            party_size=2,
            start_time=start_time,
            status='pending',
            customer=cust
        )
        assert res.status == 'pending'
        
        # Check history
        assert res.history.filter(status='pending').exists()
        
        # 2. Approve reservation
        approved_res = ReservationService.approve_reservation(res.id, user=staff, reason="VIP customer request")
        assert approved_res.status == 'confirmed'
        assert approved_res.history.filter(status='confirmed', changed_by=staff, reason="VIP customer request").exists()

    def test_reservation_rejection_flow(self, setup_features_data):
        branch = setup_features_data["branch"]
        staff = setup_features_data["staff"]
        start_time = timezone.now().replace(hour=19, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        res = ReservationService.create_reservation(
            branch_id=branch.id,
            guest_name="Reject Guest",
            guest_phone="+918888888888",
            guest_email="reject@test.com",
            party_size=2,
            start_time=start_time,
            status='pending'
        )
        
        # Reject booking
        rejected_res = ReservationService.reject_reservation(res.id, user=staff, reason="Kitchen fully booked")
        assert rejected_res.status == 'rejected'
        assert rejected_res.rejected_by == staff
        assert rejected_res.rejection_reason == "Kitchen fully booked"
        
        # Check tables released
        assert ReservationTable.objects.filter(reservation=rejected_res).count() == 0
        assert rejected_res.history.filter(status='rejected', reason="Kitchen fully booked").exists()

    def test_reservation_cancellation_flow(self, setup_features_data):
        branch = setup_features_data["branch"]
        cust = setup_features_data["customer"]
        start_time = timezone.now().replace(hour=20, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        res = ReservationService.create_reservation(
            branch_id=branch.id,
            guest_name="Cancel Guest",
            guest_phone="+918888888888",
            guest_email="cancel@test.com",
            party_size=2,
            start_time=start_time,
            status='confirmed'
        )
        
        # Cancel booking
        cancelled_res = ReservationService.cancel_reservation(res.id, user=cust, reason="Emergency change of plans")
        assert cancelled_res.status == 'cancelled'
        assert cancelled_res.cancelled_by == cust
        assert cancelled_res.cancellation_reason == "Emergency change of plans"
        assert cancelled_res.history.filter(status='cancelled', reason="Emergency change of plans").exists()

    def test_checked_in_and_seated_transition_flow(self, setup_features_data):
        branch = setup_features_data["branch"]
        staff = setup_features_data["staff"]
        start_time = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        res = ReservationService.create_reservation(
            branch_id=branch.id,
            guest_name="Walk In Guest",
            guest_phone="+918888888888",
            guest_email="walk@test.com",
            party_size=2,
            start_time=start_time,
            status='confirmed'
        )
        
        table = res.reservation_tables.first().table
        assert table.status == 'available'
        
        # Checked In transition
        res = ReservationService.check_in_guest(res.id, user=staff)
        assert res.status == 'arrived'
        table.refresh_from_db()
        assert table.status == 'occupied'
        
        # Seated/Dining transition
        res = ReservationService.seat_guest(res.id, user=staff)
        assert res.status == 'seated'
        table.refresh_from_db()
        assert table.status == 'occupied'
        
        # Completed transition
        res = ReservationService.check_out_guest(res.id, user=staff)
        assert res.status == 'completed'
        table.refresh_from_db()
        assert table.status == 'available'

    def test_qr_check_in_api_endpoint(self, setup_features_data):
        from rest_framework.test import APIClient
        client = APIClient()
        branch = setup_features_data["branch"]
        staff = setup_features_data["staff"]
        
        client.force_authenticate(user=staff)
        
        start_time = timezone.now().replace(hour=19, minute=0, second=0, microsecond=0) + timedelta(days=1)
        res = ReservationService.create_reservation(
            branch_id=branch.id,
            guest_name="QR Guest",
            guest_phone="+918888888888",
            guest_email="qr@test.com",
            party_size=2,
            start_time=start_time,
            status='confirmed'
        )
        
        url = reverse('booking-qr-check-in')
        response = client.post(url, {"reservation_id": res.id}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['status'] == 'seated'

    def test_celery_booking_reminders(self, setup_features_data):
        from unittest.mock import patch
        import datetime
        branch = setup_features_data["branch"]
        
        # Noon is inside business hours, and now + 30m, now + 2h, now + 24h are all inside business hours (12:30 PM, 2:00 PM, tomorrow 12:00 PM)
        mock_now = timezone.make_aware(datetime.datetime(2026, 7, 6, 12, 0, 0))
        
        with patch('django.utils.timezone.now', return_value=mock_now):
            res_24h = ReservationService.create_reservation(
                branch_id=branch.id,
                guest_name="24h Guest",
                guest_phone="+918888888888",
                guest_email="guest24@test.com",
                party_size=2,
                start_time=mock_now + timedelta(hours=24),
                status='confirmed'
            )
            
            res_2h = ReservationService.create_reservation(
                branch_id=branch.id,
                guest_name="2h Guest",
                guest_phone="+918888888888",
                guest_email="guest2@test.com",
                party_size=2,
                start_time=mock_now + timedelta(hours=2),
                status='confirmed'
            )
            
            res_30m = ReservationService.create_reservation(
                branch_id=branch.id,
                guest_name="30m Guest",
                guest_phone="+918888888888",
                guest_email="guest30m@test.com",
                party_size=2,
                start_time=mock_now + timedelta(minutes=30),
                status='confirmed'
            )
            
            result = send_booking_reminders()
            assert "Reminders sent" in result
            
            # Verify history indicates reminders sent
            assert res_24h.history.filter(status='reminder_sent', reason__contains="24-hour").exists()
            assert res_2h.history.filter(status='reminder_sent', reason__contains="2-hour").exists()
            assert res_30m.history.filter(status='reminder_sent', reason__contains="30-minute").exists()
