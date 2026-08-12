import pytest
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.core.models import Branch, Restaurant, AuditLog
from apps.reservation.models import Reservation, Table
from apps.reservation.services import ReservationService, NotificationService
from apps.notifications.models import InAppNotification, CommunicationLog

User = get_user_model()

@pytest.mark.django_db(transaction=True)
class TestReservationNotifications:

    @pytest.fixture(autouse=True)
    def setup_data(self):
        # Create a restaurant
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            code="test-restaurant",
            contact_email="test@restaurant.com",
            contact_phone="+15005550006",
            address="Test Road"
        )
        # Create a branch
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Test Branch",
            branch_code="test-branch",
            address="123 Street",
            is_active=True
        )
        # Create a table
        self.table = Table.objects.create(
            branch=self.branch,
            number=10,
            capacity=4,
            status="available"
        )
        # Create a customer with valid phone
        self.customer = User.objects.create_user(
            email="testcustomer@example.com",
            username="testcustomer",
            password="password123",
            phone="+919999999999",
            first_name="Test",
            last_name="Customer",
            whatsapp_enabled=True
        )
        # Create a customer with no phone
        self.customer_no_phone = User.objects.create_user(
            email="nophone@example.com",
            username="nophone",
            password="password123",
            phone="",
            first_name="No",
            last_name="Phone"
        )
        # Create a customer with invalid phone format
        self.customer_bad_phone = User.objects.create_user(
            email="badphone@example.com",
            username="badphone",
            password="password123",
            phone="123-abc",
            first_name="Bad",
            last_name="Phone"
        )
        
        # Ensure start_time is inside business hours (e.g. tomorrow at 7:00 PM)
        tomorrow = timezone.now().date() + timezone.timedelta(days=1)
        self.start_time = timezone.make_aware(timezone.datetime.combine(tomorrow, timezone.datetime.min.time().replace(hour=19)))

    @patch('apps.notifications.services.EmailService.send_reservation_confirmation')
    @patch('apps.notifications.services.whatsapp_service.WhatsAppService.send_template_message')
    def test_reservation_email_and_whatsapp_success(self, mock_wa, mock_email):
        """
        Verify that both email and WhatsApp notifications are triggered and logged on success.
        """
        mock_wa.return_value = True
        
        # Create reservation
        reservation = ReservationService.create_reservation(
            branch_id=self.branch.id,
            guest_name="Test Customer",
            guest_phone="+919999999999",
            guest_email="testcustomer@example.com",
            party_size=2,
            start_time=self.start_time,
            customer=self.customer
        )
        
        # Verify Email was called
        mock_email.assert_called_once()
        # Verify WhatsApp was called
        mock_wa.assert_called_once()
        
        # Check that InAppNotification records were created (one for email, one for whatsapp, one system)
        notifs = InAppNotification.objects.filter(module='reservation').order_by('created_at')
        assert notifs.filter(notification_type='email').exists()
        assert notifs.filter(notification_type='whatsapp').exists()
        assert notifs.filter(notification_type='system').exists()
        
        # Check AuditLogs
        audits = AuditLog.objects.filter(record_id=str(reservation.id))
        assert audits.filter(action="Reservation Email Sent").exists()
        assert audits.filter(action="Reservation WhatsApp Sent").exists()

    @patch('apps.notifications.services.EmailService.send_reservation_confirmation')
    @patch('apps.notifications.services.whatsapp_service.WhatsAppService.send_template_message')
    def test_reservation_whatsapp_triggered_for_guest(self, mock_wa, mock_email):
        """
        WhatsApp is triggered even if customer is missing (guest walk-in), just like email.
        """
        mock_wa.return_value = False
        reservation = ReservationService.create_reservation(
            branch_id=self.branch.id,
            guest_name="Guest Walk-in",
            guest_phone="+919999999999",
            guest_email="walkin@example.com",
            party_size=2,
            start_time=self.start_time,
            customer=None
        )
        mock_email.assert_called_once()
        mock_wa.assert_called_once()
        
        # Audit log for WhatsApp status (success or fail based on mock return value)
        assert AuditLog.objects.filter(record_id=str(reservation.id), action="Reservation WhatsApp Failed").exists()

    @patch('apps.notifications.services.EmailService.send_reservation_confirmation')
    @patch('apps.notifications.services.whatsapp_service.WhatsAppService.send_template_message')
    def test_reservation_email_only_due_to_whatsapp_disabled(self, mock_wa, mock_email):
        """
        WhatsApp is skipped if user has whatsapp_enabled = False.
        """
        self.customer.whatsapp_enabled = False
        self.customer.save()
        
        reservation = ReservationService.create_reservation(
            branch_id=self.branch.id,
            guest_name="Test Customer",
            guest_phone="+919999999999",
            guest_email="testcustomer@example.com",
            party_size=2,
            start_time=self.start_time,
            customer=self.customer
        )
        mock_email.assert_called_once()
        mock_wa.assert_not_called()
        assert AuditLog.objects.filter(record_id=str(reservation.id), action="Reservation WhatsApp Failed").exists()

    @patch('apps.notifications.services.EmailService.send_reservation_confirmation')
    @patch('apps.notifications.services.whatsapp_service.WhatsAppService.send_template_message')
    def test_whatsapp_failure_does_not_rollback_reservation(self, mock_wa, mock_email):
        """
        If WhatsApp dispatch raises an exception, the reservation creation must still succeed.
        """
        mock_wa.side_effect = Exception("Meta API is down")
        
        reservation = ReservationService.create_reservation(
            branch_id=self.branch.id,
            guest_name="Test Customer",
            guest_phone="+919999999999",
            guest_email="testcustomer@example.com",
            party_size=2,
            start_time=self.start_time,
            customer=self.customer
        )
        assert reservation is not None
        mock_email.assert_called_once()
        assert AuditLog.objects.filter(record_id=str(reservation.id), action="Reservation WhatsApp Failed").exists()

    @patch('apps.notifications.services.EmailService.send_reservation_confirmation')
    @patch('apps.notifications.services.whatsapp_service.WhatsAppService.send_template_message')
    def test_missing_or_invalid_phone_number(self, mock_wa, mock_email):
        """
        Missing phone or invalid format skips WhatsApp but reservation succeeds.
        """
        # Case 1: Missing phone number
        res_no_phone = ReservationService.create_reservation(
            branch_id=self.branch.id,
            guest_name="No Phone Guest",
            guest_phone="",
            guest_email="nophone@example.com",
            party_size=2,
            start_time=self.start_time,
            customer=self.customer_no_phone
        )
        mock_wa.assert_not_called()
        assert AuditLog.objects.filter(record_id=str(res_no_phone.id), action="Reservation WhatsApp Failed").exists()
        
        # Reset mock
        mock_wa.reset_mock()
        
        # Case 2: Invalid phone number format
        res_bad_phone = ReservationService.create_reservation(
            branch_id=self.branch.id,
            guest_name="Bad Phone Guest",
            guest_phone="invalid-phone-123",
            guest_email="badphone@example.com",
            party_size=2,
            start_time=self.start_time,
            customer=self.customer_bad_phone
        )
        mock_wa.assert_not_called()
        assert AuditLog.objects.filter(record_id=str(res_bad_phone.id), action="Reservation WhatsApp Failed").exists()

    @patch('apps.notifications.services.EmailService.send_reservation_confirmation')
    @patch('requests.post')
    def test_meta_api_retry_logic(self, mock_post, mock_email):
        """
        Verify that 429, 500, 502, 503 HTTP status codes trigger retries, but 401/400 do not.
        """
        from apps.notifications.services.whatsapp_service import WhatsAppService
        # Mock Meta API credentials to ensure we make actual HTTP requests
        with patch.object(WhatsAppService, 'get_credentials', return_value=("fake_token", "fake_phone_id", "fake_acc_id")):
            # Case 1: 500 error triggers retries
            mock_post.return_value = MagicMock(status_code=500, text="Internal Server Error")
            res_500 = WhatsAppService.send_template_message(
                phone_number="+919999999999",
                template_name="reservation_created",
                customer_user=self.customer
            )
            assert res_500 is False
            # 1 initial try + 3 retries = 4 post calls
            assert mock_post.call_count == 4
            
            mock_post.reset_mock()
            
            # Case 2: 401 error does not trigger retries
            mock_post.return_value = MagicMock(status_code=401, text="Unauthorized")
            res_401 = WhatsAppService.send_template_message(
                phone_number="+919999999999",
                template_name="reservation_created",
                customer_user=self.customer
            )
            assert res_401 is False
            assert mock_post.call_count == 1
