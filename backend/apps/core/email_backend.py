import os
import requests
from django.core.mail.backends.base import BaseEmailBackend

class WebhookEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        sent_count = 0
        resend_api_url = "https://api.resend.com/emails"
        
        # Read API key from environment variable to keep it secure and satisfy GitHub push protection
        api_key = os.environ.get('RESEND_API_KEY', '')
        if not api_key:
            print("[ResendEmailBackend] WARNING: RESEND_API_KEY environment variable is not set!")
            return 0
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        for message in email_messages:
            try:
                # To send with Resend free tier without a domain, the "from" address must be onboarding@resend.dev
                # and the "to" address must be the registered owner (adhityan.9r@gmail.com)
                html_body = message.body
                
                # Check for HTML content in Django's EmailMultiAlternatives
                if hasattr(message, 'alternatives'):
                    for alt, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_body = alt
                
                payload = {
                    "from": "onboarding@resend.dev",
                    "to": ["adhityan.9r@gmail.com"],  # Forced recipient to guarantee receipt in Gmail inbox
                    "subject": message.subject,
                    "html": html_body
                }
                
                print(f"[ResendEmailBackend] Sending to Resend API: {payload}")
                response = requests.post(resend_api_url, json=payload, headers=headers, timeout=10)
                
                if response.status_code in [200, 201, 202]:
                    sent_count += 1
                    print(f"[ResendEmailBackend] Successfully sent email. Response: {response.text}")
                else:
                    print(f"[ResendEmailBackend] Failed to send email: status {response.status_code}, response: {response.text}")
            except Exception as e:
                print(f"[ResendEmailBackend] Error sending message: {e}")
                
        return sent_count
