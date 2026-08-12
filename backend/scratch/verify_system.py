import os
import django
import sys

# Configure django
sys.path.append(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.notifications.models import NotificationChannelSettings, EmailTemplate, CommunicationLog
from apps.notifications.views import NotificationChannelSettingsViewSet
from apps.reservation.models import Reservation
from apps.reservation.services import ReservationService
from apps.core.models import Branch, Restaurant
from apps.authentication.models import User, Role
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.notifications.tasks import send_reservation_reminders_task, send_delayed_feedback_request

def main():
    print("=== STARTING FULL END-TO-END AUDIT & VERIFICATION ===")
    
    # Get or create admin user for testing API endpoints
    r_admin = Role.objects.get(code='admin')
    admin_user = User.objects.filter(username='e2e_admin').first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            username='e2e_admin', 
            email='admin@dinein.com', 
            password='Password123!', 
            role=r_admin
        )
    print(f"Authenticated as: {admin_user.username}")

    # Set up request factory
    factory = APIRequestFactory()

    # Step 1: Save SMTP Settings
    print("\nStep 1: Saving SMTP settings via API...")
    url = '/api/v1/communication/settings/'
    data = {
        'smtp_host': '127.0.0.1',
        'smtp_port': 1025,
        'smtp_username': 'mockuser',
        'smtp_password': 'mockpassword',
        'smtp_use_tls': False,
        'smtp_use_ssl': False,
        'smtp_sender_name': 'DineIn AI Verifier',
        'smtp_reply_email': 'no-reply@dinein.com'
    }
    
    view = NotificationChannelSettingsViewSet.as_view({'post': 'create'})
    request = factory.post(url, data, format='json')
    force_authenticate(request, user=admin_user)
    response = view(request)
    print(f"Save Settings Response Code: {response.status_code}")
    print(f"Save Settings Response Data: {response.data}")
    assert response.status_code in [200, 201], "Failed to save SMTP settings"
    
    # Step 2: Retrieve Saved Settings
    print("\nStep 2: Retrieving saved SMTP settings to verify persistence...")
    view_list = NotificationChannelSettingsViewSet.as_view({'get': 'list'})
    request_list = factory.get(url)
    force_authenticate(request_list, user=admin_user)
    response_list = view_list(request_list)
    print(f"List Settings Response Code: {response_list.status_code}")
    print(f"Settings in DB count: {len(response_list.data)}")
    assert len(response_list.data) > 0, "No settings found in DB!"
    saved_settings = response_list.data[0]
    print(f"Persisted SMTP Host: {saved_settings['smtp_host']}")
    assert saved_settings['smtp_host'] == '127.0.0.1', "Host was not saved correctly!"

    # Step 3: Test SMTP Connection
    print("\nStep 3: Testing SMTP Connection via API...")
    view_test = NotificationChannelSettingsViewSet.as_view({'post': 'test_connection'})
    request_test = factory.post('/api/v1/communication/settings/test-connection/', data, format='json')
    force_authenticate(request_test, user=admin_user)
    response_test = view_test(request_test)
    print(f"Test Connection Response Code: {response_test.status_code}")
    print(f"Test Connection Data: {response_test.data}")
    assert response_test.data.get('success') is True, "Test connection failed!"

    # Step 4: Send Test Email
    print("\nStep 4: Dispatching Live Test Email via API...")
    test_email_data = {
        'recipient': 'test_receiver@gmail.com',
        'subject': 'SMTP Verification E2E Audit',
        'message': 'Confirming SMTP relay is fully production ready.'
    }
    view_send = NotificationChannelSettingsViewSet.as_view({'post': 'send_test_email'})
    request_send = factory.post('/api/v1/communication/settings/send-test-email/', test_email_data, format='json')
    force_authenticate(request_send, user=admin_user)
    response_send = view_send(request_send)
    print(f"Send Test Email Response Code: {response_send.status_code}")
    print(f"Send Test Email Data: {response_send.data}")
    assert response_send.data.get('success') is True, "Test email dispatch failed!"

    # Step 5: Verify CommunicationLog Updated
    print("\nStep 5: Verifying CommunicationLog details...")
    logs = CommunicationLog.objects.filter(recipient='test_receiver@gmail.com').order_by('-created_at')
    print(f"Matching logs found: {logs.count()}")
    assert logs.exists(), "No log found for test recipient!"
    log = logs.first()
    print(f"Log Subject: {log.subject}")
    print(f"Log Status: {log.status}")
    print(f"Log SMTP Response: {log.smtp_response}")
    assert log.status == 'sent', f"Expected status 'sent', found '{log.status}'"
    assert log.smtp_response is not None, "Expected SMTP response payload to be logged!"

    # Step 6: Verify Reservation Email Pipeline
    print("\nStep 6: Verifying Reservation Lifecycle Emails...")
    # Get a sample branch and customer
    branch = Branch.objects.first()
    if not branch:
        restaurant = Restaurant.objects.create(name="E2E Restaurant", code="e2e-rest")
        branch = Branch.objects.create(restaurant=restaurant, name="E2E Main", branch_code="e2e-main")
    
    r_cust = Role.objects.get(code='customer')
    customer = User.objects.filter(username='cust_user_0').first()
    if not customer:
        customer = User.objects.create_user(
            username='cust_user_0', 
            email='customer@dinein.com', 
            password='Password123!', 
            role=r_cust
        )

    # 6a. Reservation Created
    print("- Creating reservation...")
    import datetime
    from django.utils import timezone
    res = Reservation.objects.create(
        branch=branch,
        customer=customer,
        guest_name="Jane Diner",
        guest_email="jane_diner@gmail.com",
        guest_phone="+919876543210",
        party_size=2,
        start_time=timezone.now() + datetime.timedelta(days=1),
        end_time=timezone.now() + datetime.timedelta(days=1, hours=2),
        status='pending'
    )
    
    # Trigger confirmation email
    from apps.reservation.services import NotificationService
    print("- Sending confirmation email...")
    NotificationService.send_reservation_confirmation(res)
    confirm_logs = CommunicationLog.objects.filter(recipient="jane_diner@gmail.com", subject__contains="Logged").order_by('-created_at')
    assert confirm_logs.exists(), "Confirmation log not found!"
    confirm_log = confirm_logs.first()
    print(f"Confirmation email status: {confirm_log.status}")
    print(f"QR Seating Pass included: {'qr_code_url' in confirm_log.body or 'create-qr-code' in confirm_log.body}")
    assert confirm_log.status == 'sent'
    assert 'create-qr-code' in confirm_log.body, "Expected QR Seating Pass to be rendered in confirmation email!"

    # 6b. Reservation Approved
    print("- Approving reservation...")
    res.status = 'confirmed'
    res.save()
    NotificationService.send_reservation_approved(res)
    app_logs = CommunicationLog.objects.filter(recipient="jane_diner@gmail.com", subject__contains="Confirmed").order_by('-created_at')
    assert app_logs.exists(), "Approval log not found!"
    app_log = app_logs.first()
    print(f"Approval email status: {app_log.status}")
    assert app_log.status == 'sent'

    # 6c. Reservation Check-In (Welcome Email)
    print("- Checking in reservation...")
    res.status = 'checked_in'
    res.save()
    NotificationService.send_reservation_welcome(res)
    welcome_logs = CommunicationLog.objects.filter(recipient="jane_diner@gmail.com", subject__contains="Welcome").order_by('-created_at')
    assert welcome_logs.exists(), "Welcome log not found!"
    welcome_log = welcome_logs.first()
    print(f"Welcome email status: {welcome_log.status}")
    assert welcome_log.status == 'sent'

    # 6d. Reservation Check-Out (Thank You Email & Feedback Request)
    print("- Checking out reservation...")
    res.status = 'completed'
    res.save()
    NotificationService.send_reservation_thank_you(res)
    thank_logs = CommunicationLog.objects.filter(recipient="jane_diner@gmail.com", subject__contains="Thank you").order_by('-created_at')
    assert thank_logs.exists(), "Thank you log not found!"
    thank_log = thank_logs.first()
    print(f"Thank you email status: {thank_log.status}")
    assert thank_log.status == 'sent'
    print(f"Feedback Review Button included: {'Leave Feedback Review' in thank_log.body or 'feedback_link' in thank_log.body}")
    assert 'Leave Feedback Review' in thank_log.body or 'feedback_link' in thank_log.body, "Expected Feedback link in Thank You email!"

    # 6e. Create a new CONFIRMED reservation exactly 24 hours from now to test automated reminders
    print("- Creating another confirmed reservation 24h away...")
    res_upcoming = Reservation.objects.create(
        branch=branch,
        customer=customer,
        guest_name="Upcoming Diner",
        guest_email="jane_diner@gmail.com",
        guest_phone="+919876543210",
        party_size=4,
        start_time=timezone.now() + datetime.timedelta(hours=24),
        end_time=timezone.now() + datetime.timedelta(hours=26),
        status='confirmed'
    )
    print("- Running reminder scans Celery task...")
    send_reservation_reminders_task()
    reminder_logs = CommunicationLog.objects.filter(recipient="jane_diner@gmail.com", subject__contains="Reminder").order_by('-created_at')
    print(f"Reminder logs created: {reminder_logs.count()}")
    assert reminder_logs.exists(), "No reminder log found!"
    reminder_log = reminder_logs.first()
    print(f"24h Reminder email subject: {reminder_log.subject}")
    print(f"24h Reminder email status: {reminder_log.status}")
    assert reminder_log.status == 'sent'

    print("\n=== ALL E2E PIPELINE CHECKS PASSED SUCCESSFULLY! ===")

if __name__ == '__main__':
    main()
