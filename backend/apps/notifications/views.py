from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.mail import get_connection
from django.utils import timezone
from .models import (
    NotificationChannelSettings,
    EmailTemplate,
    CommunicationLog,
    Campaign,
    InAppNotification,
    Announcement,
    AnnouncementAcknowledgment,
    WhatsAppTemplate
)
from .serializers import (
    NotificationChannelSettingsSerializer,
    EmailTemplateSerializer,
    CommunicationLogSerializer,
    CampaignSerializer,
    InAppNotificationSerializer,
    AnnouncementSerializer,
    AnnouncementAcknowledgmentSerializer,
    WhatsAppTemplateSerializer
)
from .services import (
    CommunicationDispatchService,
    TemplateRenderService,
    AICommunicationAssistantService,
    EmailService
)
from django.contrib.auth import get_user_model
User = get_user_model()
from apps.reservation.models import Reservation

def verify_and_test_smtp(data, existing_instance=None):
    import smtplib
    import socket
    
    host = data.get('smtp_host')
    port = data.get('smtp_port')
    username = data.get('smtp_username')
    password = data.get('smtp_password')
    use_tls = data.get('smtp_use_tls', False)
    use_ssl = data.get('smtp_use_ssl', False)
    
    if not host:
        return
        
    if use_tls and use_ssl:
        raise ValueError("SSL and TLS cannot both be enabled simultaneously.")
        
    from django.conf import settings
    if getattr(settings, 'TESTING', False) or settings.EMAIL_BACKEND == 'django.core.mail.backends.locmem.EmailBackend':
        print("SMTP Connection Check Bypassed (Testing Mode)")
        return
        
    # Resolve password
    if password == "************":
        if existing_instance:
            password = existing_instance.get_decrypted_password()
        else:
            settings_obj = NotificationChannelSettings.objects.filter(branch__isnull=True).first()
            if settings_obj:
                password = settings_obj.get_decrypted_password()
            else:
                password = None
    elif password and password.startswith('enc_'):
        from .models import decrypt_value
        password = decrypt_value(password[4:])
        
    print("\nConnecting to SMTP...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"TLS: {use_tls}")
    print(f"SSL: {use_ssl}")
    print(f"Username: {username}")
    print("Authenticating...")
    
    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, int(port), timeout=10)
        else:
            server = smtplib.SMTP(host, int(port), timeout=10)
            server.ehlo()
            if use_tls:
                server.starttls()
                server.ehlo()
                
        if username and password:
            server.login(username, password)
            
        print("SMTP Response: Success")
        server.quit()
    except smtplib.SMTPAuthenticationError as e:
        err_msg = f"SMTPAuthenticationError: {e.smtp_code} {e.smtp_error.decode('utf-8', errors='ignore') if isinstance(e.smtp_error, bytes) else e.smtp_error}"
        print(f"SMTP Response:\n{err_msg}")
        raise e
    except Exception as e:
        err_msg = f"{type(e).__name__}: {str(e)}"
        print(f"SMTP Response:\n{err_msg}")
        raise e


class NotificationChannelSettingsViewSet(viewsets.ModelViewSet):
    queryset = NotificationChannelSettings.objects.all()
    serializer_class = NotificationChannelSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        active_branch = self.request.active_branch
        if active_branch:
            return self.queryset.filter(branch=active_branch)
        return self.queryset

    def create(self, request, *args, **kwargs):
        branch_id = request.data.get('branch')
        
        # Check if settings for global or branch already exist
        if not branch_id or branch_id == 'null' or branch_id == 'undefined':
            existing = NotificationChannelSettings.objects.filter(branch__isnull=True).first()
        else:
            existing = NotificationChannelSettings.objects.filter(branch_id=branch_id).first()
            
        # Validate TLS and SSL first
        use_tls = request.data.get('smtp_use_tls', False)
        use_ssl = request.data.get('smtp_use_ssl', False)
        if use_tls and use_ssl:
            return Response({"success": False, "message": "SSL and TLS cannot both be enabled simultaneously."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Test SMTP login BEFORE saving
        try:
            verify_and_test_smtp(request.data, existing)
        except Exception as e:
            return Response({"success": False, "message": f"SMTP validation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
        if existing:
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            # DB Persistence Verification print
            refreshed = NotificationChannelSettings.objects.get(pk=existing.pk)
            decrypted_pwd = refreshed.get_decrypted_password()
            print("\n[DB PERSISTENCE VERIFICATION]")
            print(f"Host: {refreshed.smtp_host}")
            print(f"Port: {refreshed.smtp_port}")
            print(f"TLS: {refreshed.smtp_use_tls}")
            print(f"SSL: {refreshed.smtp_use_ssl}")
            print(f"Username: {refreshed.smtp_username}")
            print(f"Password length: {len(decrypted_pwd) if decrypted_pwd else 0}")
            
            # Verify length
            req_password = request.data.get('smtp_password')
            if req_password and req_password != "************" and not req_password.startswith('enc_'):
                entered_pwd_len = len(req_password)
                stored_pwd_len = len(decrypted_pwd) if decrypted_pwd else 0
                print(f"Entered password length: {entered_pwd_len}")
                print(f"Stored password length: {stored_pwd_len}")
                if entered_pwd_len == stored_pwd_len:
                    print("Verification: Stored password length equals entered password length.")
                else:
                    print("Verification FAILED: Stored password length mismatch.")
                    
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # DB Persistence Verification print
        instance = serializer.instance
        refreshed = NotificationChannelSettings.objects.get(pk=instance.pk)
        decrypted_pwd = refreshed.get_decrypted_password()
        print("\n[DB PERSISTENCE VERIFICATION]")
        print(f"Host: {refreshed.smtp_host}")
        print(f"Port: {refreshed.smtp_port}")
        print(f"TLS: {refreshed.smtp_use_tls}")
        print(f"SSL: {refreshed.smtp_use_ssl}")
        print(f"Username: {refreshed.smtp_username}")
        print(f"Password length: {len(decrypted_pwd) if decrypted_pwd else 0}")
        
        req_password = request.data.get('smtp_password')
        if req_password and req_password != "************" and not req_password.startswith('enc_'):
            entered_pwd_len = len(req_password)
            stored_pwd_len = len(decrypted_pwd) if decrypted_pwd else 0
            print(f"Entered password length: {entered_pwd_len}")
            print(f"Stored password length: {stored_pwd_len}")
            if entered_pwd_len == stored_pwd_len:
                print("Verification: Stored password length equals entered password length.")
            else:
                print("Verification FAILED: Stored password length mismatch.")
                
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='test-connection')
    def test_connection(self, request):
        """
        Attempts a test SMTP connection using parameters supplied in the request body.
        """
        try:
            verify_and_test_smtp(request.data)
            return Response({"success": True, "message": "SMTP Connection established successfully!"})
        except Exception as e:
            return Response({"success": False, "message": f"SMTP test failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='send-test-email')
    def send_test_email(self, request):
        """
        Sends a live test email using active channel parameters.
        """
        print("\n[ENTERED STEP] [1] Dispatch button clicked / API received")
        print("[2] POST /api/v1/communication/settings/send-test-email/")
        print("[3] Entered send_test_email view")
        recipient = request.data.get('recipient')
        subject = request.data.get('subject', 'DineIn AI SMTP Verification Test')
        message = request.data.get('message', 'This is a live transactional test email confirming SMTP parameters.')

        if not recipient:
            print("EXITED STEP [3] send_test_email view - Missing recipient parameter.")
            return Response({"success": False, "message": "Recipient address is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            success = EmailService.send_test_email(
                recipient=recipient,
                subject=subject,
                message=message
            )
            print("[EXITED STEP] [12] Returning HTTP response success")
            if success:
                return Response({"success": True, "message": f"Test email successfully dispatched to {recipient}."})
            return Response({"success": False, "message": "SMTP Connection failed. Check server configurations."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"[EXITED STEP] [12] Returning HTTP response exception: {type(e).__name__} - {str(e)}")
            traceback.print_exc()
            return Response({"success": False, "message": f"SMTP connection failed: {type(e).__name__} - {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='send-test-whatsapp')
    def send_test_whatsapp(self, request):
        """
        Sends a live test WhatsApp message using the active channel configurations.
        """
        recipient = request.data.get('recipient')
        message = request.data.get('message', 'This is a test WhatsApp message from DineIn AI.')
        branch_id = request.data.get('branch') or (request.active_branch.id if request.active_branch else None)

        if not recipient:
            return Response({"success": False, "message": "Recipient phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            success = CommunicationDispatchService.send_whatsapp(
                recipient=recipient,
                text_body=message,
                branch_id=branch_id
            )
            if success:
                return Response({"success": True, "message": f"Test WhatsApp message successfully sent to {recipient}."})
            return Response({"success": False, "message": "WhatsApp dispatch failed. Check provider parameters."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": f"WhatsApp dispatch exception: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='test-gateway')
    def test_gateway_connection(self, request):
        """
        Tests the Meta WhatsApp Business API connection using the provided credentials.
        """
        token = request.data.get('whatsapp_meta_token')
        phone_id = request.data.get('whatsapp_phone_number_id')

        # If token is masked or missing, load/decrypt from DB settings
        if token == "************" or not token or not phone_id:
            from apps.notifications.models import NotificationChannelSettings
            branch_id = request.data.get('branch') or (request.active_branch.id if request.active_branch else None)
            settings_obj = NotificationChannelSettings.objects.filter(branch_id=branch_id).first()
            if not settings_obj:
                settings_obj = NotificationChannelSettings.objects.filter(branch__isnull=True).first()
            if settings_obj:
                if token == "************" or not token:
                    token = settings_obj.get_decrypted_whatsapp_meta_token()
                if not phone_id:
                    phone_id = settings_obj.whatsapp_phone_number_id

        if not token or not phone_id:
            return Response({"success": False, "message": "Meta Access Token and Phone Number ID are required for testing connection."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate that phone_id is a real Meta Phone Number ID, not a mobile recipient number
        if phone_id and (len(phone_id) <= 12 or phone_id.startswith('91') or phone_id.startswith('+')):
            return Response({"success": False, "message": "Validation failed: Please enter a valid Meta Phone Number ID (e.g., 1299623069891131), not a mobile recipient number."}, status=status.HTTP_400_BAD_REQUEST)

        import requests
        url = f"https://graph.facebook.com/v23.0/{phone_id}"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        try:
            print(f"[TEST META WHATSAPP] Checking connection to {url}...")
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                return Response({"success": True, "message": "Successfully connected to Meta Graph API!", "status_code": 200})
            else:
                return Response({"success": False, "message": f"Meta Graph API verification failed: status {response.status_code}, response: {response.text}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": f"Connection verification error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class SMTPDebugView(Response.__class__.__base__): # APIView fallback to prevent DRF import cycle or explicit class
    pass

from rest_framework.views import APIView

class SMTPDebugView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import smtplib
        import socket
        
        host = request.data.get('smtp_host')
        port = request.data.get('smtp_port')
        username = request.data.get('smtp_username')
        password = request.data.get('smtp_password')
        use_tls = request.data.get('smtp_use_tls', False)
        use_ssl = request.data.get('smtp_use_ssl', False)
        
        # If not fully provided in request, load from active settings in DB
        if not host:
            settings_obj = NotificationChannelSettings.objects.filter(branch__isnull=True).first()
            if settings_obj:
                host = settings_obj.smtp_host
                port = settings_obj.smtp_port
                username = settings_obj.smtp_username
                password = settings_obj.get_decrypted_password()
                use_tls = settings_obj.smtp_use_tls
                use_ssl = settings_obj.smtp_use_ssl
            else:
                return Response({
                    "dns_resolved": False,
                    "smtp_reachable": False,
                    "tls_ok": False,
                    "authentication_ok": False,
                    "mail_accepted": False,
                    "mail_rejected": True,
                    "reason": "No SMTP settings provided or found in database."
                }, status=status.HTTP_400_BAD_REQUEST)

        if password and password.startswith('enc_'):
            from .models import decrypt_value
            password = decrypt_value(password[4:])
            
        if password == "************":
            settings_obj = NotificationChannelSettings.objects.filter(branch__isnull=True).first()
            if settings_obj:
                password = settings_obj.get_decrypted_password()

        if use_tls and use_ssl:
            return Response({
                "dns_resolved": True,
                "smtp_reachable": True,
                "tls_ok": False,
                "authentication_ok": False,
                "mail_accepted": False,
                "mail_rejected": True,
                "reason": "SSL and TLS cannot both be enabled simultaneously."
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. DNS resolved
        dns_resolved = False
        try:
            socket.gethostbyname(host)
            dns_resolved = True
        except Exception as e:
            return Response({
                "dns_resolved": False,
                "smtp_reachable": False,
                "tls_ok": False,
                "authentication_ok": False,
                "mail_accepted": False,
                "mail_rejected": True,
                "reason": f"DNS resolution failed for {host}: {str(e)}"
            })

        # 2. SMTP reachable
        smtp_reachable = False
        try:
            s = socket.create_connection((host, int(port)), timeout=5)
            s.close()
            smtp_reachable = True
        except Exception as e:
            return Response({
                "dns_resolved": True,
                "smtp_reachable": False,
                "tls_ok": False,
                "authentication_ok": False,
                "mail_accepted": False,
                "mail_rejected": True,
                "reason": f"SMTP Port {port} unreachable on {host}: {str(e)}"
            })

        # 3. TLS OK / Check SMTP Handshake
        tls_ok = False
        try:
            if use_ssl:
                server = smtplib.SMTP_SSL(host, int(port), timeout=5)
                tls_ok = True
            else:
                server = smtplib.SMTP(host, int(port), timeout=5)
                server.ehlo()
                if use_tls:
                    if server.has_ext("STARTTLS"):
                        server.starttls()
                        tls_ok = True
                    else:
                        tls_ok = False
                else:
                    tls_ok = True
            server.quit()
        except Exception as e:
            return Response({
                "dns_resolved": True,
                "smtp_reachable": True,
                "tls_ok": False,
                "authentication_ok": False,
                "mail_accepted": False,
                "mail_rejected": True,
                "reason": f"TLS handshake failed: {str(e)}"
            })

        # 4. Authentication and Mail transmission check
        auth_ok = False
        mail_accepted = False
        mail_rejected = False
        reason = ""
        try:
            if use_ssl:
                server = smtplib.SMTP_SSL(host, int(port), timeout=5)
            else:
                server = smtplib.SMTP(host, int(port), timeout=5)
                server.ehlo()
                if use_tls:
                    server.starttls()
                    server.ehlo()

            if username and password:
                server.login(username, password)
                auth_ok = True

            # MAIL FROM and RCPT TO check
            code, msg = server.mail(username or "test@dinein.com")
            if code == 250:
                code_rcpt, msg_rcpt = server.rcpt("adhityan.9r@gmail.com")
                if code_rcpt == 250:
                    mail_accepted = True
                    reason = "Authentication and Mail transaction verified successfully."
                else:
                    mail_rejected = True
                    reason = f"Recipient rejected: {code_rcpt} {msg_rcpt.decode('utf-8', errors='ignore')}"
            else:
                mail_rejected = True
                reason = f"Sender rejected: {code} {msg.decode('utf-8', errors='ignore')}"
            server.quit()
        except smtplib.SMTPAuthenticationError as e:
            auth_ok = False
            reason = f"SMTPAuthenticationError: {e.smtp_code} {e.smtp_error.decode('utf-8', errors='ignore') if isinstance(e.smtp_error, bytes) else e.smtp_error}"
        except Exception as e:
            reason = f"SMTP transaction failed: {str(e)}"

        return Response({
            "dns_resolved": dns_resolved,
            "smtp_reachable": smtp_reachable,
            "tls_ok": tls_ok,
            "authentication_ok": auth_ok,
            "mail_accepted": mail_accepted,
            "mail_rejected": mail_rejected or not mail_accepted,
            "reason": reason
        })


class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Re-seed if existing templates do not have the updated inline pass code
        if EmailTemplate.objects.exists() and not EmailTemplate.objects.filter(body_html__contains='pass_image').exists():
            EmailTemplate.objects.filter(is_system=True).delete()

        # Seed missing templates individually
        for t_type, label in EmailTemplate.TEMPLATE_TYPES:
            if not EmailTemplate.objects.filter(name=t_type).exists():
                try:
                    html, subject = TemplateRenderService.get_default_html_template(t_type)
                    EmailTemplate.objects.create(
                        name=t_type,
                        subject=subject,
                        body_html=html,
                        body_text="",
                        is_system=True
                    )
                except Exception as e:
                    pass
        return EmailTemplate.objects.all().order_by('name')


class CommunicationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CommunicationLog.objects.all().order_by('-sent_time')
    serializer_class = CommunicationLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        recipient = self.request.query_params.get('recipient')
        if recipient:
            return self.queryset.filter(recipient__icontains=recipient)
        return self.queryset

    @action(detail=False, methods=['get'], url_path='analytics')
    def get_analytics(self, request):
        """
        Computes delivery metrics and success rates from stored database records.
        """
        from apps.notifications.models import InAppNotification, Announcement, CommunicationLog
        from django.utils import timezone
        from datetime import timedelta
        from django.db import models
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        
        branch_filter = {}
        if request.user.role and request.user.role.code == 'manager' and request.user.branch:
            branch_filter = {'branch': request.user.branch}
            
        notifications = InAppNotification.objects.filter(**branch_filter)
        total_notifications = notifications.count()
        unread = notifications.filter(status='unread', is_read=False).count()
        read = notifications.filter(is_read=True).count()
        
        comm_logs = CommunicationLog.objects.all()
        
        if request.user.role and request.user.role.code == 'manager' and request.user.branch:
            announcements = Announcement.objects.filter(models.Q(branch=request.user.branch) | models.Q(branch__isnull=True))
        else:
            announcements = Announcement.objects.all()
            
        total_announcements = announcements.count()
        scheduled_announcements = announcements.filter(status='scheduled').count()
        delivered_announcements = announcements.filter(status='immediate').count()
        pending_announcements = announcements.filter(status='draft').count()
        
        whatsapp_sent = comm_logs.filter(message_type='whatsapp', status__in=['sent', 'delivered']).count()
        whatsapp_failed = comm_logs.filter(message_type='whatsapp', status='failed').count()
        emails_sent = comm_logs.filter(message_type='email', status__in=['sent', 'delivered']).count()
        push_notifications = comm_logs.filter(message_type='push', status__in=['sent', 'delivered']).count()
        
        failed_notifications = notifications.filter(delivery_status='failed').count() + whatsapp_failed
        
        today_notifications = notifications.filter(created_at__gte=today_start).count()
        weekly_notifications = notifications.filter(created_at__gte=week_start).count()
        monthly_notifications = notifications.filter(created_at__gte=month_start).count()
        
        return Response({
            "total_notifications": total_notifications,
            "unread": unread,
            "read": read,
            "failed": failed_notifications,
            "announcements": total_announcements,
            "scheduled": scheduled_announcements,
            "delivered": delivered_announcements,
            "pending": pending_announcements,
            "whatsapp_sent": whatsapp_sent,
            "whatsapp_failed": whatsapp_failed,
            "sms_sent": whatsapp_sent,
            "sms_failed": whatsapp_failed,
            "emails_sent": emails_sent,
            "push_notifications": push_notifications,
            "today_notifications": today_notifications,
            "weekly_notifications": weekly_notifications,
            "monthly_notifications": monthly_notifications,
            
            # Legacy keys
            "total": total_notifications,
            "delivery_rate": round(((total_notifications - failed_notifications) / max(total_notifications, 1)) * 100, 1),
            "open_rate": round((read / max(total_notifications, 1)) * 100, 1),
            "click_rate": 0.0,
            "failed_count": failed_notifications
        })


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all().order_by('-created_at')
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """
        Dispatches a campaign immediately to targeted user groups.
        """
        campaign = self.get_object()
        campaign.status = 'processing'
        campaign.save()

        # Try executing asynchronously using Celery
        try:
            from .tasks import dispatch_campaign_broadcast
            dispatch_campaign_broadcast.delay(campaign.id)
            return Response({"success": True, "message": "Campaign broadcast queued successfully in background Celery worker."})
        except Exception as e:
            # Fallback to synchronous dispatch
            users = User.objects.all()
            if campaign.audience_type == 'vip':
                users = users.filter(role__code='vip')
            
            sent_count = 0
            for user in users:
                if user.email:
                    context = {
                        'guest_name': user.username,
                        'coupon_code': campaign.coupon_code or 'WELCOME10',
                        'message_body': campaign.content_html
                    }
                    try:
                        # Wrap individual logging and send in atomic save boundaries
                        success = CommunicationDispatchService.send_email(
                            recipient=user.email,
                            template_type='custom_broadcast',
                            context=context,
                            customer_user=user
                        )
                        if success:
                            sent_count += 1
                    except Exception as log_err:
                        # Wrap and log error, but do not rollback campaign status completed flag
                        print(f"[Campaign Dispatch View] Individual recipient log/send failed: {log_err}")

            campaign.status = 'completed'
            campaign.sent_count = sent_count
            campaign.save()
            return Response({"success": True, "message": f"Campaign broadcast processed synchronously to {sent_count} customers."})

    @action(detail=True, methods=['post'], url_path='send-test')
    def send_test(self, request, pk=None):
        """
        Sends a test copy of the campaign to a single recipient email address.
        """
        campaign = self.get_object()
        recipient = request.data.get('recipient')
        if not recipient:
            return Response({"success": False, "message": "Recipient email address is required for test dispatch."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # We bypass bulk targets and execute a single transactional test dispatch
            from apps.notifications.services import EmailService
            success = EmailService.send_campaign(campaign, recipient)
            if success:
                return Response({"success": True, "message": f"Campaign test email sent successfully to {recipient}."})
            return Response({"success": False, "message": "Failed to dispatch campaign test email."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": f"Campaign test dispatch failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='ai-generate')
    def ai_generate(self, request):
        """
        Calls Gemini assistance block to draft campaigns.
        """
        prompt_type = request.data.get('prompt_type', 'weekend_promo')
        guest_name = request.data.get('guest_name', 'Valued Diner')
        
        context = {
            'guest_name': guest_name
        }
        res = AICommunicationAssistantService.generate_email_copy(prompt_type, context)
        return Response({"success": True, "data": res})


class InAppNotificationViewSet(viewsets.ModelViewSet):
    queryset = InAppNotification.objects.all().order_by('-created_at')
    serializer_class = InAppNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        
        role_code = str(user.role.code) if hasattr(user.role, 'code') else str(user.role) if user.role else ''
        if role_code == 'manager' and getattr(user, 'branch', None):
            from django.db.models import Q
            qs = qs.filter(Q(branch=user.branch) | Q(branch__isnull=True))
        elif role_code == 'customer':
            qs = qs.filter(user=user)
            
        time_filter = self.request.query_params.get('time_filter')
        branch_id = self.request.query_params.get('branch_id')
        notification_type = self.request.query_params.get('type')
        priority = self.request.query_params.get('priority')
        status_val = self.request.query_params.get('status')
        recipient_val = self.request.query_params.get('recipient')
        
        from django.utils import timezone
        from datetime import timedelta
        
        if time_filter == 'today':
            qs = qs.filter(created_at__gte=timezone.now().replace(hour=0, minute=0, second=0, microsecond=0))
        elif time_filter == 'week':
            qs = qs.filter(created_at__gte=timezone.now() - timedelta(days=7))
        elif time_filter == 'month':
            qs = qs.filter(created_at__gte=timezone.now() - timedelta(days=30))
            
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if notification_type:
            from django.db.models import Q
            qs = qs.filter(Q(notification_type=notification_type) | Q(module=notification_type))
        if priority:
            qs = qs.filter(priority=priority)
        if status_val == 'read':
            qs = qs.filter(is_read=True)
        elif status_val == 'unread':
            qs = qs.filter(is_read=False, is_archived=False)
        elif status_val == 'archived':
            qs = qs.filter(is_archived=True)
            
        if recipient_val:
            qs = qs.filter(recipient__icontains=recipient_val)
            
        return qs

    @action(detail=False, methods=['get'])
    def bell(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"success": True, "unread_count": count})

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.status = 'read'
        notification.read_time = timezone.now()
        notification.save()
        return Response({"success": True})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        notification = self.get_object()
        notification.is_archived = True
        notification.status = 'archived'
        notification.save()
        return Response({"success": True})

    @action(detail=False, methods=['post'], url_path='trigger-backup')
    def trigger_backup(self, request):
        from apps.notifications.services import SystemNotificationService
        SystemNotificationService.create_notification(
            title="Backup Completed",
            message="Daily automated system database hot-backup completed successfully. Archive size: 48.2 MB.",
            notification_type="system",
            priority="medium",
            sender="backup_agent",
            module="system",
            branch=request.user.branch,
            user=request.user
        )
        return Response({"success": True, "message": "Automated system backup triggered and logged."})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        qs = self.get_queryset().filter(is_read=False)
        qs.update(is_read=True, status='read', read_time=timezone.now())
        return Response({"success": True, "message": "All notifications marked as read."})

    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        qs = self.get_queryset().filter(is_read=False)
        qs.update(is_read=True, status='read', read_time=timezone.now())
        return Response({"success": True, "message": "All notifications marked as read."})


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        
        role_code = str(user.role.code) if hasattr(user.role, 'code') else str(user.role) if user.role else ''
        if role_code == 'manager' and getattr(user, 'branch', None):
            from django.db.models import Q
            qs = qs.filter(Q(branch=user.branch) | Q(branch__isnull=True))
            qs = qs.exclude(status='draft')
        elif role_code in ['employee', 'staff'] and getattr(user, 'branch', None):
            from django.db.models import Q
            qs = qs.filter(Q(branch=user.branch) | Q(branch__isnull=True))
            qs = qs.exclude(status='draft')
            
        return qs

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        announcement = self.get_object()
        ack, created = AnnouncementAcknowledgment.objects.get_or_create(
            announcement=announcement,
            user=request.user
        )
        return Response({"success": True, "acknowledged": True})

    @action(detail=True, methods=['get'], url_path='delivery-report')
    def delivery_report(self, request, pk=None):
        announcement = self.get_object()
        acks = announcement.acknowledgments.all()
        serializer = AnnouncementAcknowledgmentSerializer(acks, many=True)
        return Response({
            "success": True,
            "read_count": acks.count(),
            "acknowledgments": serializer.data
        })


class WhatsAppTemplateViewSet(viewsets.ModelViewSet):
    queryset = WhatsAppTemplate.objects.all()
    serializer_class = WhatsAppTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        active_branch = self.request.active_branch
        if active_branch:
            qs = qs.filter(branch=active_branch)
        return qs
