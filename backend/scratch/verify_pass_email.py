import os
import django
import sys

sys.path.append(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.reservation.models import Reservation
from apps.notifications.services import EmailService, generate_reservation_pass_image
from apps.notifications.models import CommunicationLog

def main():
    print("=== LIVE GMAIL VERIFICATION WITH INLINE PREMIUM RESERVATION PASS ===")
    
    # 1. Fetch first reservation from DB
    res = Reservation.objects.first()
    if not res:
        print("Error: No reservations found in database. Cannot run pass email test.")
        return
        
    print(f"Testing with Reservation ID: {res.id}")
    print(f"Guest: {res.guest_name}")
    print(f"Party Size: {res.party_size}")
    print(f"Start Time: {res.start_time}")
    
    # 2. Build the pass image bytes
    try:
        pass_bytes = generate_reservation_pass_image(str(res.id))
        print(f"Pass Image successfully generated! Size: {len(pass_bytes)} bytes")
    except Exception as e:
        print(f"Pass Generation FAILED: {e}")
        return

    # 3. Trigger live transactional confirmation email dispatch to user
    recipient = "adhityan.9r@gmail.com"
    print(f"\nSending real email to {recipient} with inline premium pass...")
    try:
        success = EmailService.send_reservation_confirmation(res)
        print(f"Send Confirmation Status: {success}")
        
        # Verify database outbox log
        logs = CommunicationLog.objects.filter(recipient=recipient).order_by('-created_at')
        if logs.exists():
            log = logs.first()
            print("\nDatabase CommunicationLog Verification:")
            print(f"Subject: {log.subject}")
            print(f"Status: {log.status}")
            print(f"SMTP Response: {log.smtp_response}")
            if log.status == 'sent':
                print("\n=== SUCCESS: E2E Premium Pass email delivered! ===")
            else:
                print("\n=== FAILURE: Log status is not SENT. Check SMTP error field.")
        else:
            print("\nError: Outbox log not created in database.")
    except Exception as e:
        print(f"E2E send failed with exception: {e}")

if __name__ == '__main__':
    main()
