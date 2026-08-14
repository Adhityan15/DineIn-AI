import requests
from django.core.mail.backends.base import BaseEmailBackend

class WebhookEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        sent_count = 0
        webhook_url = "https://dinein-demo.free.beeceptor.com"
        
        for message in email_messages:
            try:
                # Prepare payload
                payload = {
                    "to": message.to,
                    "subject": message.subject,
                    "body": message.body,
                    "from_email": message.from_email,
                }
                
                # Check for HTML content in alternatives
                if hasattr(message, 'alternatives'):
                    for alt, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            payload['html_body'] = alt
                
                # Send HTTP POST request to the webhook
                requests.post(webhook_url, json=payload, timeout=5)
                sent_count += 1
            except Exception as e:
                print(f"[WebhookEmailBackend] Error sending message: {e}")
                
        return sent_count
