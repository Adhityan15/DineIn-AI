from django.core.management.base import BaseCommand
from apps.notifications.services import WhatsAppService

class Command(BaseCommand):
    help = "Sends a sample Reservation Confirmation WhatsApp message to the configured test number."

    def add_arguments(self, parser):
        parser.add_argument('phone_number', type=str, help='The recipient phone number (including country code, e.g., +919876543210)')

    def handle(self, *args, **options):
        phone_number = options['phone_number']
        self.stdout.write(f"Sending sample Reservation Confirmation to {phone_number}...")
        
        # parameters: guest_name, branch_name, start_time
        success = WhatsAppService.send_template(
            phone_number=phone_number,
            template_name='reservation_confirmation',
            parameters={
                'guest_name': 'John Doe',
                'branch_name': 'Bangalore Main Branch',
                'start_time': '2026-08-01 07:30 PM'
            }
        )
        
        if success:
            self.stdout.write(self.style.SUCCESS("WhatsApp message dispatched successfully!"))
        else:
            self.stdout.write(self.style.ERROR("WhatsApp message dispatch failed. Check credentials and API response logs."))
