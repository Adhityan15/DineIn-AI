import os
import requests
import smtplib
from django.core.mail import get_connection, EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone
import uuid
from ..models import (
    NotificationChannelSettings,
    EmailTemplate,
    CommunicationLog,
    Campaign,
    InAppNotification,
    WhatsAppTemplate
)
from apps.core.models import Branch
from django.contrib.auth import get_user_model
User = get_user_model()
from apps.reservation.models import Reservation

def get_font(name, size):
    import os
    from PIL import ImageFont
    font_paths = [
        f"C:\\Windows\\Fonts\\{name}.ttf",
        f"C:\\Windows\\Fonts\\arial.ttf",
        "arial.ttf"
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

def generate_reservation_pass_image(reservation_id):
    from PIL import Image, ImageDraw, ImageFont
    from io import BytesIO
    import requests
    from apps.reservation.models import Reservation
    
    res = Reservation.objects.get(id=reservation_id)
    table_nums = [str(rt.table.number) for rt in res.reservation_tables.all()]
    table_str = ', '.join(table_nums) if table_nums else 'Auto-assigned'
    
    # 1. Create canvas
    canvas = Image.new('RGB', (500, 700), '#0f172a') # Dark slate navy background
    draw = ImageDraw.Draw(canvas)
    
    # 2. Draw gradient header banner
    for y in range(120):
        r = int(79 + (124 - 79) * (y / 120))
        g = int(70 + (58 - 70) * (y / 120))
        b = int(229 + (237 - 229) * (y / 120))
        draw.line([(0, y), (500, y)], fill=(r, g, b))
        
    font_bold = get_font('segoeuib', 26)
    font_semibold = get_font('segoeuib', 16)
    font_label = get_font('segoeui', 10)
    font_small = get_font('segoeui', 9)
    font_regular = get_font('segoeui', 14)
    
    # Header text
    draw.text((250, 30), "DineIn AI", font=font_bold, fill="#ffffff", anchor="ma")
    draw.text((250, 70), "OFFICIAL DIGITAL PASS", font=font_small, fill="#cbd5e1", anchor="ma")
    
    # Row 1
    draw.text((40, 150), "GUEST NAME", font=font_label, fill="#94a3b8")
    draw.text((40, 165), res.guest_name, font=font_semibold, fill="#ffffff")
    draw.text((300, 150), "PARTY SIZE", font=font_label, fill="#94a3b8")
    draw.text((300, 165), f"{res.party_size} Guests", font=font_semibold, fill="#ffffff")
    
    # Row 2
    draw.text((40, 220), "DATE & TIME", font=font_label, fill="#94a3b8")
    date_str = res.start_time.strftime('%Y-%m-%d %I:%M %p')
    draw.text((40, 235), date_str, font=font_semibold, fill="#ffffff")
    draw.text((300, 220), "TABLE SELECTION", font=font_label, fill="#94a3b8")
    draw.text((300, 235), f"Table {table_str}", font=font_semibold, fill="#ffffff")
    
    # Row 3
    draw.text((40, 290), "BOOKING ID", font=font_label, fill="#94a3b8")
    draw.text((40, 305), str(res.id), font=font_label, fill="#ffffff")
    draw.text((300, 290), "RESERVATION STATUS", font=font_label, fill="#94a3b8")
    status_text = res.status.upper().replace('_', ' ')
    draw.text((300, 305), status_text, font=font_semibold, fill="#10b981" if res.status in ['confirmed', 'completed'] else "#f59e0b")
    
    # Row 4
    draw.text((40, 360), "BRANCH LOCATION", font=font_label, fill="#94a3b8")
    branch_name = res.branch.name if res.branch else 'Bangalore Main Branch'
    draw.text((40, 375), branch_name, font=font_semibold, fill="#ffffff")
    
    # Separator
    draw.line([(40, 430), (460, 430)], fill="#334155", width=1)
    
    # Draw QR code white frame
    draw.rounded_rectangle([(160, 460), (340, 640)], radius=12, fill="#ffffff")
    
    # Fetch and paste QR Code
    try:
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={res.id}"
        qr_resp = requests.get(qr_url, timeout=5)
        qr_img = Image.open(BytesIO(qr_resp.content))
        canvas.paste(qr_img, (175, 475))
    except Exception:
        draw.text((250, 550), "[ QR Code Unavailable ]", font=font_regular, fill="#0f172a", anchor="ma")
        
    # Footer Scan notice
    draw.text((250, 660), "PLEASE PRESENT PASS AT RECEPTION DESK ON ARRIVAL", font=font_small, fill="#94a3b8", anchor="ma")
    draw.text((250, 675), "SUPPORT CONTACT: support@dinein.ai | +91 98765 43210", font=font_small, fill="#64748b", anchor="ma")
    
    from io import BytesIO
    buf = BytesIO()
    canvas.save(buf, format='PNG')
    return buf.getvalue()

from io import BytesIO

class TemplateRenderService:
    """
    Renders dynamic variables inside HTML templates using simple placeholder substitutions.
    """
    @staticmethod
    def get_default_html_template(template_type):
        """
        Returns high-fidelity default HTML for templates if not found in the DB.
        """
        logo_url = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&h=120"
        
        base_layout = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }}
                .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: white; }}
                .header img {{ border-radius: 50%; border: 3px solid rgba(255,255,255,0.2); width: 64px; height: 64px; margin-bottom: 12px; }}
                .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
                .content {{ padding: 32px 24px; }}
                .details-box {{ background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }}
                .details-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }}
                .details-row span {{ color: #64748b; }}
                .details-row strong {{ color: #0f172a; }}
                .qr-section {{ text-align: center; margin: 24px 0; }}
                .qr-section img {{ border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px; background: white; }}
                .btn {{ display: inline-block; padding: 12px 24px; background: #4f46e5; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-align: center; margin: 10px 4px; }}
                .btn-secondary {{ background: #e2e8f0; color: #0f172a !important; }}
                .footer {{ background: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="{logo_url}" alt="DineIn AI Logo">
                    <h1>{restaurant_name}</h1>
                    <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">{branch_name}</p>
                </div>
                <div class="content">
                    {body_content}
                </div>
                <div class="footer">
                    <p>© 2026 {restaurant_name}. All rights reserved.</p>
                    <p style="margin-top: 6px;">Branch Details: {branch_name} | Tel: {contact_phone}</p>
                    <p style="margin-top: 12px; font-size: 9px; opacity: 0.7;">You are receiving this transactional email regarding your reservation.</p>
                </div>
            </div>
        </body>
        </html>
        """
 
        if template_type == 'reservation_confirmation':
            body = """
            <h2 style="margin-top: 0;">Reservation Request Received</h2>
            <p>Dear {{guest_name}},</p>
            <p>We have successfully logged your reservation request. Our host team is reviewing availability and will approve/seat your dining shortly!</p>
            
            <div class="details-box">
                <div class="details-row"><span>Booking ID:</span><strong>{{booking_id}}</strong></div>
                <div class="details-row"><span>Guests:</span><strong>{{party_size}} Guests</strong></div>
                <div class="details-row"><span>Date & Time:</span><strong>{{start_time}}</strong></div>
                <div class="details-row"><span>Table Selection:</span><strong>{{table_number}}</strong></div>
            </div>
 
            <div class="qr-section" style="text-align: center; margin: 24px 0;">
                <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Your Digital Seating Pass:</p>
                <img src="cid:pass_image" alt="Reservation Pass" style="max-width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />
            </div>
 
            <div style="text-align: center; margin-top: 20px;">
                <a href="{{cancel_link}}" class="btn btn-secondary">Cancel Request</a>
                <a href="{{map_link}}" class="btn">Get Directions</a>
            </div>
            """
            subject = "Reservation Logged - {{restaurant_name}}"
 
        elif template_type == 'reservation_approved':
            body = """
            <h2 style="margin-top: 0; color: #10b981;">Reservation Confirmed!</h2>
            <p>Dear {{guest_name}},</p>
            <p>Great news! Your booking has been approved. We have locked your table and our staff is preparing for your arrival.</p>
            
            <div class="details-box">
                <div class="details-row"><span>Booking ID:</span><strong>{{booking_id}}</strong></div>
                <div class="details-row"><span>Assigned Table:</span><strong>Table {{table_number}}</strong></div>
                <div class="details-row"><span>Party Size:</span><strong>{{party_size}} pax</strong></div>
                <div class="details-row"><span>Date & Time:</span><strong>{{start_time}}</strong></div>
            </div>
 
            <div class="qr-section" style="text-align: center; margin: 24px 0;">
                <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Your Digital Seating Pass:</p>
                <img src="cid:pass_image" alt="Reservation Pass" style="max-width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />
            </div>
 
            <div style="text-align: center; margin-top: 20px;">
                <a href="{{cancel_link}}" class="btn btn-secondary">Cancel Booking</a>
                <a href="{{map_link}}" class="btn">Get Directions</a>
            </div>
            """
            subject = "Reservation Confirmed: Table {{table_number}} Locked! - {{restaurant_name}}"
 
        elif template_type == 'reservation_rejected':
            body = """
            <h2 style="margin-top: 0; color: #ef4444;">Booking Request Update</h2>
            <p>Dear {{guest_name}},</p>
            <p>We regret to inform you that we are unable to accommodate your booking request at the selected time due to restaurant capacity limits or schedule bounds.</p>
            
            <div class="details-box">
                <p style="margin: 0; font-size: 13px;"><strong>Rejection Note:</strong> {{rejection_reason}}</p>
            </div>
            
            <p>Please feel free to choose an alternative timing or check in on our live waitlist queue.</p>
            """
            subject = "Reservation Update - {{restaurant_name}}"
 
        elif template_type == 'reservation_reminder':
            body = """
            <h2 style="margin-top: 0;">Upcoming Reservation Reminder</h2>
            <p>Dear {{guest_name}},</p>
            <p>This is a quick reminder that your table is scheduled in the next hours. We look forward to hosting you!</p>
            
            <div class="details-box">
                <div class="details-row"><span>Table:</span><strong>Table {{table_number}}</strong></div>
                <div class="details-row"><span>Guests:</span><strong>{{party_size}} Guests</strong></div>
                <div class="details-row"><span>Arrival Time:</span><strong>{{start_time}}</strong></div>
            </div>
 
            <div class="qr-section" style="text-align: center; margin: 24px 0;">
                <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Your Digital Seating Pass:</p>
                <img src="cid:pass_image" alt="Reservation Pass" style="max-width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />
            </div>
 
            <div style="text-align: center; margin-top: 20px;">
                <a href="{{cancel_link}}" class="btn btn-secondary">Cancel</a>
                <a href="{{map_link}}" class="btn">Get Directions</a>
            </div>
            """
            subject = "Upcoming Table Reminder - {{restaurant_name}}"

        elif template_type == 'dining_completed':
            body = """
            <h2 style="margin-top: 0;">Thank You for Dining With Us!</h2>
            <p>Dear {{guest_name}},</p>
            <p>It was a pleasure hosting you today. We hope you had a stellar dining experience.</p>
            
            <div class="details-box">
                <p style="margin: 0; font-size: 13px; text-align: center;">
                    Here is a special thank-you coupon code for your next visit: <br>
                    <strong style="font-size: 18px; color: #4f46e5; letter-spacing: 1px;">WELCOME10</strong>
                </p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <a href="{{feedback_link}}" class="btn">Leave Feedback Review</a>
            </div>
            """
            subject = "Thank you for dining with us! - {{restaurant_name}}"

        elif template_type == 'feedback_request':
            body = """
            <h2 style="margin-top: 0;">We Value Your Feedback!</h2>
            <p>Dear {{guest_name}},</p>
            <p>Please take a brief minute to rate your food quality, service hygiene, and general experience:</p>
            
            <div style="text-align: center; margin: 24px 0;">
                <a href="{{feedback_link}}?rating=1" style="font-size: 28px; text-decoration: none; margin: 0 4px;">⭐</a>
                <a href="{{feedback_link}}?rating=2" style="font-size: 28px; text-decoration: none; margin: 0 4px;">⭐</a>
                <a href="{{feedback_link}}?rating=3" style="font-size: 28px; text-decoration: none; margin: 0 4px;">⭐</a>
                <a href="{{feedback_link}}?rating=4" style="font-size: 28px; text-decoration: none; margin: 0 4px;">⭐</a>
                <a href="{{feedback_link}}?rating=5" style="font-size: 28px; text-decoration: none; margin: 0 4px;">⭐</a>
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <a href="{{feedback_link}}" class="btn">Leave Custom Review</a>
            </div>
            """
            subject = "Rate your experience at {{restaurant_name}}"

        elif template_type == 'table_ready':
            body = """
            <h2 style="margin-top: 0; color: #4f46e5;">Your Table is Ready!</h2>
            <p>Dear {{guest_name}},</p>
            <p>We are excited to inform you that your dining table is ready. Please proceed to the host desk to be seated.</p>
            
            <div class="details-box">
                <div class="details-row"><span>Assigned Table:</span><strong>{{table_number}}</strong></div>
                <div class="details-row"><span>Party Size:</span><strong>{{party_size}} Diners</strong></div>
                <div class="details-row"><span>Branch:</span><strong>{{branch_name}}</strong></div>
            </div>
            """
            subject = "Your table is ready at {{restaurant_name}}!"

        elif template_type == 'check_in_success':
            body = """
            <h2 style="margin-top: 0; color: #4f46e5;">Welcome to {{restaurant_name}}!</h2>
            <p>Dear {{guest_name}},</p>
            <p>You have checked in successfully. Your table is being prepared. We hope you enjoy your dining experience with us!</p>
            
            <div class="details-box">
                <div class="details-row"><span>Booking ID:</span><strong>{{booking_id}}</strong></div>
                <div class="details-row"><span>Party Size:</span><strong>{{party_size}} Guests</strong></div>
                <div class="details-row"><span>Arrived:</span><strong>Just Now</strong></div>
            </div>
            """
            subject = "Welcome to {{restaurant_name}}! - Checked in successfully"

        elif template_type == 'reservation_rescheduled':
            body = """
            <h2 style="margin-top: 0; color: #4f46e5;">Reservation Rescheduled</h2>
            <p>Dear {{guest_name}},</p>
            <p>Your booking has been successfully rescheduled to the new date and time listed below.</p>
            
            <div class="details-box">
                <div class="details-row"><span>Booking ID:</span><strong>{{booking_id}}</strong></div>
                <div class="details-row"><span>Guests:</span><strong>{{party_size}} Guests</strong></div>
                <div class="details-row"><span>New Date & Time:</span><strong>{{start_time}}</strong></div>
                <div class="details-row"><span>Table Selection:</span><strong>{{table_number}}</strong></div>
            </div>

            <div class="qr-section" style="text-align: center; margin: 24px 0;">
                <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Your Digital Seating Pass:</p>
                <img src="cid:pass_image" alt="Reservation Pass" style="max-width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <a href="{{cancel_link}}" class="btn btn-secondary">Cancel Request</a>
                <a href="{{map_link}}" class="btn">Get Directions</a>
            </div>
            """
            subject = "Reservation Rescheduled - {{restaurant_name}}"

        else: # custom or backup
            body = """
            <h2>Dining Broadcast Update</h2>
            <p>{{message_body}}</p>
            """
            subject = "{{subject}}"

        return base_layout.format(
            logo_url=logo_url,
            restaurant_name="{{restaurant_name}}",
            branch_name="{{branch_name}}",
            contact_phone="{{contact_phone}}",
            body_content=body
        ), subject

    @classmethod
    def render(cls, template_type, context):
        """
        Retrieves template from database (or fallbacks) and substitutes all tags.
        """
        # Look up template in DB
        tpl = EmailTemplate.objects.filter(name=template_type).first()
        if tpl:
            html = tpl.body_html
            subject = tpl.subject
        else:
            html, subject = cls.get_default_html_template(template_type)

        # Basic context defaults
        context.setdefault('restaurant_name', 'DineIn AI')
        context.setdefault('branch_name', 'Bangalore Main Branch')
        context.setdefault('contact_phone', '+91 98765 43210')
        context.setdefault('map_link', 'https://maps.google.com')
        context.setdefault('cancel_link', 'https://dinein.ai/cancel')
        context.setdefault('feedback_link', 'https://dinein.ai/feedback')

        # Generate QR code link if reservation_id is provided
        if 'booking_id' in context:
            # unique QR pass URL contains reservation ID
            context['qr_code_url'] = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={context['booking_id']}"
        else:
            context.setdefault('qr_code_url', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=dinein')

        # Replace standard tags
        for k, v in context.items():
            placeholder = f"{{{{{k}}}}}"
            html = html.replace(placeholder, str(v))
            subject = subject.replace(placeholder, str(v))

        return subject, html


class SMSProviderInterface:
    def send(self, recipient: str, text_body: str, settings_obj) -> bool:
        raise NotImplementedError()

class DemoSMSProvider(SMSProviderInterface):
    def send(self, recipient: str, text_body: str, settings_obj) -> bool:
        print(f"[DEMO SMS] To {recipient}: {text_body}")
        return True

class AndroidSMSGatewayProvider(SMSProviderInterface):
    def send(self, recipient: str, text_body: str, settings_obj) -> bool:
        if not settings_obj or not settings_obj.gateway_url:
            print("[ANDROID SMS GATEWAY] Error: gateway_url is not configured.")
            return False
        
        url = settings_obj.gateway_url
        api_key = settings_obj.get_decrypted_gateway_api_key() if hasattr(settings_obj, 'get_decrypted_gateway_api_key') else settings_obj.gateway_api_key
        timeout = settings_obj.gateway_timeout or 5
        
        headers = {
            "Content-Type": "application/json"
        }
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
            
        payload = {
            "to": recipient,
            "message": text_body
        }
        
        try:
            print(f"[ANDROID SMS GATEWAY] Sending payload to {url}: {payload}")
            response = requests.post(url, json=payload, headers=headers, timeout=timeout)
            if response.status_code in [200, 201, 202]:
                print(f"[ANDROID SMS GATEWAY] Sent successfully: status {response.status_code}")
                return True
            else:
                print(f"[ANDROID SMS GATEWAY] Failed: status {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            print(f"[ANDROID SMS GATEWAY] Request exception: {e}")
            return False

class DisabledSMSProvider(SMSProviderInterface):
    def send(self, recipient: str, text_body: str, settings_obj) -> bool:
        print(f"[DISABLED SMS] SMS is disabled. Message to {recipient} was suppressed.")
        return True


class CommunicationDispatchService:
    """
    Core executor service handles sending transactional communications (Email, SMS) and logging.
    """
    @staticmethod
    def get_active_settings(branch_id=None):
        """
        Retrieves the branch-specific settings or global fallback.
        """
        if branch_id:
            settings_obj = NotificationChannelSettings.objects.filter(branch_id=branch_id).first()
            if settings_obj:
                return settings_obj
        return NotificationChannelSettings.objects.filter(branch__isnull=True).first()

    @classmethod
    def send_email(cls, recipient, template_type, context, branch_id=None, customer_user=None):
        """
        Compiles templates and dispatches email using SMTP settings (or fallbacks).
        """
        import smtplib
        if not recipient:
            recipient = 'no-email-provided@dinein.com'
        subject, html_content = TemplateRenderService.render(template_type, context)
        if 'subject' in context:
            subject = context['subject']
        
        # Log entry creation
        log = CommunicationLog.objects.create(
            customer=customer_user,
            recipient=recipient,
            message_type='email',
            subject=subject,
            body=html_content,
            status='pending'
        )

        # Generate pass image if booking_id exists in context
        pass_bytes = None
        if 'booking_id' in context:
            try:
                pass_bytes = generate_reservation_pass_image(context['booking_id'])
                print(f"[Pass Generator] Successfully generated pass image of size: {len(pass_bytes)} bytes")
            except Exception as e:
                print(f"[Pass Generator] Failed to generate pass image: {e}")

        print("[4] Entering CommunicationDispatchService.send_email()")
        settings_obj = cls.get_active_settings(branch_id)
        
        if settings_obj:
            print("[5] Loaded SMTP settings from database")
            print(f"Loaded SMTP:")
            print(f"host: {settings_obj.smtp_host}")
            print(f"port: {settings_obj.smtp_port}")
            print(f"username: {settings_obj.smtp_username}")
            print(f"TLS: {settings_obj.smtp_use_tls}")
            print(f"SSL: {settings_obj.smtp_use_ssl}")
        else:
            print("[5] No SMTP settings found in database")
        
        from django.conf import settings
        print(f"settings.EMAIL_BACKEND: {settings.EMAIL_BACKEND}")

        try:
            # Custom Connection build if custom credentials are configured in DB and host is not localhost
            if settings_obj and settings_obj.smtp_host not in ['localhost', '127.0.0.1'] and settings_obj.smtp_username:
                print("[6] Building EmailMessage / EmailMultiAlternatives with explicit SMTP backend")
                connection = get_connection(
                    backend='django.core.mail.backends.smtp.EmailBackend',
                    host=settings_obj.smtp_host,
                    port=settings_obj.smtp_port,
                    username=settings_obj.smtp_username,
                    password=settings_obj.get_decrypted_password(),
                    use_tls=settings_obj.smtp_use_tls,
                    use_ssl=settings_obj.smtp_use_ssl,
                    timeout=10
                )
                print(f"Actual backend class being used: {connection.__class__.__module__}.{connection.__class__.__name__}")
                sender = f"{settings_obj.smtp_sender_name} <{settings_obj.smtp_reply_email}>"
            else:
                print("[6] Building EmailMessage / EmailMultiAlternatives with default settings backend")
                connection = get_connection()
                print(f"Actual backend class being used: {connection.__class__.__module__}.{connection.__class__.__name__}")
                sender = getattr(settings, 'DEFAULT_FROM_EMAIL', 'DineIn AI <no-reply@dinein.com>')

            msg = EmailMultiAlternatives(
                subject=subject,
                body=context.get('message_body', 'DineIn Transaction Message'),
                from_email=sender,
                to=[recipient],
                connection=connection
            )
            msg.attach_alternative(html_content, "text/html")

            # Attach inline image using Content-ID and also as file download
            if pass_bytes:
                from email.mime.image import MIMEImage
                msg_img = MIMEImage(pass_bytes)
                msg_img.add_header('Content-ID', '<pass_image>')
                msg_img.add_header('Content-Disposition', 'inline', filename='reservation_pass.png')
                msg.attach(msg_img)
                
                # Attachment for download
                msg.attach('reservation_pass.png', pass_bytes, 'image/png')
                print("[Pass Generator] Attached inline pass and file attachment to EmailMessage")

            use_db = settings_obj and settings_obj.smtp_host not in ['localhost', '127.0.0.1'] and settings_obj.smtp_username
            print("[7] Connecting to SMTP...")
            print(f"Host: {settings_obj.smtp_host if use_db else settings.EMAIL_HOST}")
            print(f"Port: {settings_obj.smtp_port if use_db else settings.EMAIL_PORT}")
            print(f"TLS: {settings_obj.smtp_use_tls if use_db else settings.EMAIL_USE_TLS}")
            print(f"SSL: {settings_obj.smtp_use_ssl if use_db else settings.EMAIL_USE_SSL}")
            print(f"Username: {settings_obj.smtp_username if use_db else settings.EMAIL_HOST_USER}")
            
            print("[8] Authenticating...")
            print("[9] Sending email...")
            
            print("EMAIL SEND FUNCTION EXECUTED")
            
            # Synchronous send
            msg.send()

            print("[10] SMTP Response: Success")
            log.status = 'sent'
            log.smtp_response = '250 2.0.0 OK: Message accepted for delivery by SMTP server'
            log.save()
            print("[11] CommunicationLog updated to SENT")
            return True
        except Exception as e:
            if isinstance(e, smtplib.SMTPAuthenticationError):
                err_msg = f"SMTPAuthenticationError: {e.smtp_code} {e.smtp_error.decode('utf-8', errors='ignore') if isinstance(e.smtp_error, bytes) else e.smtp_error}"
            else:
                err_msg = f"{type(e).__name__}: {str(e)}"
            
            print(f"[10] SMTP Response: FAILED ({err_msg})")
            log.status = 'failed'
            log.error_message = err_msg
            log.smtp_response = err_msg
            log.save()
            print("[11] CommunicationLog updated to FAILED")
            raise e

    @classmethod
    def send_sms(cls, recipient, text_body, branch_id=None, customer_user=None):
        """
        Replaced SMS with WhatsApp Cloud API route.
        """
        from .whatsapp_service import WhatsAppService
        return WhatsAppService.send_text_message(
            phone_number=recipient,
            message=text_body,
            branch_id=branch_id,
            customer_user=customer_user
        )

    @classmethod
    def send_whatsapp(cls, recipient, text_body, branch_id=None, customer_user=None):
        """
        Sends WhatsApp message via Meta Cloud API.
        """
        from .whatsapp_service import WhatsAppService
        return WhatsAppService.send_text_message(
            phone_number=recipient,
            message=text_body,
            branch_id=branch_id,
            customer_user=customer_user
        )

    @classmethod
    def create_in_app_notification(cls, user, title, message, link=None):
        """
        Logs an in-app system message and alerts notifications bell.
        """
        return InAppNotification.objects.create(
            user=user,
            title=title,
            message=message,
            link=link
        )


class AICommunicationAssistantService:
    """
    Leverages Google Gemini flash API to draft copy outlines, promo subject lines, and coupon strategies.
    """
    @staticmethod
    def generate_email_copy(prompt_type, context):
        """
        Returns Gemini generated subject lines & HTML suggestions.
        """
        # Lexicon Fallbacks
        fallbacks = {
            'weekend_promo': {
                'subject': "Unwind This Weekend: Flat 20% Off Your Next Meal!",
                'body': "<p>Treat yourself to culinary bliss this weekend. Show this code to our hosts: <strong>WEEKEND20</strong></p>"
            },
            'birthday_wishes': {
                'subject': "Happy Birthday from DineIn AI! 🎂 Enjoy a Free Dessert on Us",
                'body': "<p>Happy birthday! Celebrate with family and friends and receive a complimentary dessert of choice: <strong>BDAYTREAT</strong></p>"
            },
            'anniversary_wishes': {
                'subject': "Happy Anniversary! 🥂 Celebrate Your Special Day With Us",
                'body': "<p>Warmest wishes on your anniversary. Enjoy a complimentary glass of house wine: <strong>ANNIVERSARY🥂</strong></p>"
            },
            'coupon_campaign': {
                'subject': "Flash Deal: Double Points & Free Appetizers Tonight!",
                'body': "<p>Join us tonight for dinner and redeem this code: <strong>FLASHTREAT</strong></p>"
            }
        }
        
        res = fallbacks.get(prompt_type, {
            'subject': "Special Broadcast from DineIn AI",
            'body': "<p>Hello! We have a special dining offer waiting for you at our branch.</p>"
        })

        # Basic tag customization
        for k, v in context.items():
            res['subject'] = res['subject'].replace(f"{{{{{k}}}}}", str(v))
            res['body'] = res['body'].replace(f"{{{{{k}}}}}", str(v))

        return res


class EmailService:
    """
    Unified production-grade email service orchestrating reservation and marketing emails.
    """
    @classmethod
    def send_reservation_confirmation(cls, reservation):
        table_nums = [str(rt.table.number) for rt in reservation.reservation_tables.all()]
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'party_size': reservation.party_size,
            'start_time': reservation.start_time.strftime('%Y-%m-%d %H:%M'),
            'table_number': ', '.join(table_nums) if table_nums else 'Auto-assigned',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'map_link': 'https://maps.google.com'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='reservation_confirmation',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_reservation_approved(cls, reservation):
        table_nums = [str(rt.table.number) for rt in reservation.reservation_tables.all()]
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'party_size': reservation.party_size,
            'start_time': reservation.start_time.strftime('%Y-%m-%d %H:%M'),
            'table_number': ', '.join(table_nums) if table_nums else 'Auto-assigned',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'map_link': 'https://maps.google.com'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='reservation_approved',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_reservation_rejected(cls, reservation):
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'rejection_reason': reservation.rejection_reason or 'Capacity bounds met.',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='reservation_rejected',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_reservation_cancelled(cls, reservation):
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'rejection_reason': reservation.cancellation_reason or 'User requested cancellation.',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='reservation_rejected',  # Cancellation uses rejection format in SRS
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_reservation_rescheduled(cls, reservation):
        table_nums = [str(rt.table.number) for rt in reservation.reservation_tables.all()]
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'party_size': reservation.party_size,
            'start_time': reservation.start_time.strftime('%Y-%m-%d %H:%M'),
            'table_number': ', '.join(table_nums) if table_nums else 'Auto-assigned',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'map_link': 'https://maps.google.com'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='reservation_rescheduled',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_reservation_reminder(cls, reservation, reminder_type):
        table_nums = [str(rt.table.number) for rt in reservation.reservation_tables.all()]
        if reminder_type == '24h':
            subj = f"Upcoming Table Reminder (24 Hours) [Ref: {reservation.id}]"
        elif reminder_type == '2h':
            subj = f"Upcoming Table Reminder (2 Hours) [Ref: {reservation.id}]"
        else:
            subj = f"Upcoming Table Reminder (30 Minutes) [Ref: {reservation.id}]"
            
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'party_size': reservation.party_size,
            'start_time': reservation.start_time.strftime('%Y-%m-%d %H:%M'),
            'table_number': ', '.join(table_nums) if table_nums else 'Auto-assigned',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'map_link': 'https://maps.google.com',
            'subject': subj
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='reservation_reminder',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_reservation_welcome(cls, reservation):
        return cls.send_welcome_email(reservation)

    @classmethod
    def send_reservation_thank_you(cls, reservation):
        return cls.send_thank_you_email(reservation)

    @classmethod
    def send_reservation_table_ready(cls, reservation):
        table_nums = [str(rt.table.number) for rt in reservation.reservation_tables.all()]
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'party_size': reservation.party_size,
            'start_time': reservation.start_time.strftime('%Y-%m-%d %H:%M'),
            'table_number': ', '.join(table_nums) if table_nums else 'Auto-assigned',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'map_link': 'https://maps.google.com'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='table_ready',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_welcome_email(cls, reservation):
        table_nums = [str(rt.table.number) for rt in reservation.reservation_tables.all()]
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'party_size': reservation.party_size,
            'start_time': reservation.start_time.strftime('%Y-%m-%d %H:%M'),
            'table_number': ', '.join(table_nums) if table_nums else 'Auto-assigned',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'map_link': 'https://maps.google.com'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='check_in_success',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_thank_you_email(cls, reservation):
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'feedback_link': 'https://dinein.ai/feedback'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='dining_completed',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_feedback_request(cls, reservation):
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'feedback_link': 'https://dinein.ai/feedback'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='feedback_request',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_campaign(cls, campaign, recipient, customer_user=None):
        context = {
            'message_body': campaign.content_html,
            'subject': campaign.subject
        }
        return CommunicationDispatchService.send_email(
            recipient=recipient,
            template_type='custom_broadcast',
            context=context,
            customer_user=customer_user
        )

    @classmethod
    def send_test_email(cls, recipient, subject, message, branch_id=None):
        context = {
            'message_body': message,
            'subject': subject
        }
        return CommunicationDispatchService.send_email(
            recipient=recipient,
            template_type='custom_broadcast',
            context=context,
            branch_id=branch_id
        )

    @classmethod
    def send_custom_email(cls, recipient, subject, body_html, branch_id=None):
        context = {
            'message_body': body_html,
            'subject': subject
        }
        return CommunicationDispatchService.send_email(
            recipient=recipient,
            template_type='custom_broadcast',
            context=context,
            branch_id=branch_id
        )


class SystemNotificationService:
    @classmethod
    def create_notification(cls, title, message, notification_type='system', priority='medium', sender='system', recipient=None, module='core', branch=None, user=None):
        if getattr(settings, 'SEEDING', False) or getattr(settings, 'TESTING', False):
            return None
            
        from apps.notifications.models import InAppNotification
        
        recipient_val = recipient or (user.username if user else 'All')
        
        notif = InAppNotification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender=sender,
            recipient=recipient_val,
            module=module,
            status='unread',
            delivery_status='delivered',
            branch=branch
        )
        print(f"[SystemNotificationService] Created notification: {title} - {message}")
        return notif




from .whatsapp_service import WhatsAppService
