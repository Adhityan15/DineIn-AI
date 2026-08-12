import os
from django.core.management.base import BaseCommand
from apps.notifications.services.whatsapp_service import WhatsAppService

class Command(BaseCommand):
    help = "Test WhatsApp Business Cloud API integration by sending a sample template message."

    def handle(self, *args, **options):
        # Read environment variables
        token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
        phone_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
        acc_id = os.environ.get("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
        test_number = os.environ.get("WHATSAPP_TEST_NUMBER", "919994795959")
        template = os.environ.get("WHATSAPP_DEFAULT_TEMPLATE", "jaspers_market_order_confirmation")

        self.stdout.write("=========================================================")
        self.stdout.write("WHATSAPP CONFIGURATION CHECK")
        self.stdout.write("=========================================================")
        self.stdout.write(f"Access Token: {'SET' if token else 'MISSING'}")
        self.stdout.write(f"Phone Number ID: {phone_id}")
        self.stdout.write(f"Business Account ID: {acc_id}")
        self.stdout.write(f"Test Recipient Number: {test_number}")
        self.stdout.write(f"Template Name: {template}")
        self.stdout.write("=========================================================\n")

        if not token or not phone_id:
            self.stdout.write(self.style.ERROR("Error: Access Token or Phone Number ID is missing in environment variables."))
            return

        self.stdout.write(f"Dispatched template '{template}' to {test_number}...")

        parameters = {
            "customer_name": "Jasper Guest",
            "order_id": "1004",
            "estimated_delivery": "Today"
        }

        # Let's send the template message using WhatsAppService
        success = WhatsAppService.send_template_message(
            phone_number=test_number,
            template_name=template,
            parameters=parameters
        )

        # Get last created log for API Response details
        from apps.notifications.models import CommunicationLog
        log = CommunicationLog.objects.filter(recipient=test_number, message_type='whatsapp').order_by('-created_at').first()

        self.stdout.write("\n=========================================================")
        self.stdout.write("API RESPONSE STATUS")
        self.stdout.write("=========================================================")
        if success:
            self.stdout.write(self.style.SUCCESS("Success: Yes"))
            self.stdout.write(f"Message ID: {log.message_id if log else 'N/A'}")
            self.stdout.write(f"API Response: {log.api_response if log else 'N/A'}")
        else:
            self.stdout.write(self.style.ERROR("Success: No"))
            self.stdout.write(f"Message ID: N/A")
            self.stdout.write(f"API Response: {log.api_response if log else 'N/A'}")
        self.stdout.write("=========================================================")
