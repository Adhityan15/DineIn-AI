import os
import django
import sys

sys.path.append(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.notifications.models import NotificationChannelSettings, CommunicationLog
from apps.notifications.services import EmailService

def main():
    print("=== GOOGLE GMAIL E2E SMTP AUDIT AND VALIDATION ===")
    
    # 1. Fetch saved setting from DB
    settings_obj = NotificationChannelSettings.objects.filter(branch__isnull=True).first()
    if not settings_obj:
        print("Error: No global SMTP settings found in database!")
        return

    print("\nSaved Database Settings:")
    print(f"Host: {settings_obj.smtp_host}")
    print(f"Port: {settings_obj.smtp_port}")
    print(f"TLS: {settings_obj.smtp_use_tls}")
    print(f"SSL: {settings_obj.smtp_use_ssl}")
    print(f"Username: {settings_obj.smtp_username}")
    decrypted_pwd = settings_obj.get_decrypted_password()
    print(f"Decrypted Password length: {len(decrypted_pwd)}")

    # 2. Verify TLS and SSL are not both enabled
    if settings_obj.smtp_use_tls and settings_obj.smtp_use_ssl:
        print("Error: TLS and SSL are both enabled. Invalid state!")
        return

    # 3. Test SMTP Connection
    print("\nAttempting SMTP Authentication check...")
    import smtplib
    try:
        if settings_obj.smtp_use_ssl:
            server = smtplib.SMTP_SSL(settings_obj.smtp_host, settings_obj.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(settings_obj.smtp_host, settings_obj.smtp_port, timeout=15)
            server.ehlo()
            if settings_obj.smtp_use_tls:
                server.starttls()
                server.ehlo()
                
        server.login(settings_obj.smtp_username, decrypted_pwd)
        print("SMTP Authentication: Success! App Password accepted.")
        server.quit()
    except Exception as e:
        print(f"SMTP Authentication FAILED: {str(e)}")
        return

    # 4. Send E2E test email to user
    recipient = "adhityan.9r@gmail.com"
    subject = "Production Email Delivery Verification - DineIn AI"
    message = "Hello Adhityan,\n\nConfirming that the DineIn AI Restaurant Management System has successfully integrated Gmail SMTP delivery. This email was generated using the stored database credentials and completed validation successfully."
    
    print(f"\nSending real E2E email to {recipient}...")
    try:
        success = EmailService.send_test_email(
            recipient=recipient,
            subject=subject,
            message=message
        )
        print(f"Send Email status: {success}")
        
        # Verify outbox log
        logs = CommunicationLog.objects.filter(recipient=recipient).order_by('-created_at')
        if logs.exists():
            log = logs.first()
            print("\nDatabase CommunicationLog:")
            print(f"Subject: {log.subject}")
            print(f"Status: {log.status}")
            print(f"SMTP Response: {log.smtp_response}")
            print(f"Timestamp: {log.sent_time}")
            if log.status == 'sent':
                print("\n=== SUCCESS: Gmail E2E verification complete! ===")
            else:
                print("\n=== FAILURE: Email status in log is not SENT! ===")
        else:
            print("\nError: No CommunicationLog generated in database.")
    except Exception as e:
        print(f"E2E send failed: {str(e)}")

if __name__ == '__main__':
    main()
