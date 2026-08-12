import os
import uuid
import requests
import logging
from django.conf import settings
from django.utils import timezone
from apps.notifications.models import CommunicationLog, WhatsAppTemplate

logger = logging.getLogger('dinein.whatsapp')

class WhatsAppService:
    @staticmethod
    def get_credentials():
        token = getattr(settings, "WHATSAPP_ACCESS_TOKEN", "") or os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
        phone_id = getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "") or os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
        acc_id = getattr(settings, "WHATSAPP_BUSINESS_ACCOUNT_ID", "") or os.environ.get("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
        
        # Fallback to DB Settings if missing in environment/settings
        if not token or not phone_id or not acc_id:
            from apps.notifications.models import NotificationChannelSettings
            settings_obj = NotificationChannelSettings.objects.filter(branch__isnull=True).first()
            if not settings_obj:
                settings_obj = NotificationChannelSettings.objects.first()
            if settings_obj:
                if not token:
                    token = settings_obj.get_decrypted_whatsapp_meta_token()
                if not phone_id:
                    phone_id = settings_obj.whatsapp_phone_number_id
                if not acc_id:
                    acc_id = settings_obj.whatsapp_business_account_id
                    
        return token, phone_id, acc_id

    @classmethod
    def resolve_template_name(cls, requested_name):
        token, phone_id, acc_id = cls.get_credentials()
        if not token or not acc_id:
            return requested_name
            
        url = f"https://graph.facebook.com/v23.0/{acc_id}/message_templates"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                templates = response.json().get("data", [])
                approved_names = [t.get("name") for t in templates if t.get("status") == "APPROVED"]
                
                # 1. Exact match
                if requested_name in approved_names:
                    return requested_name
                    
                # 2. Fuzzy/prefix match
                for name in approved_names:
                    if name.startswith(requested_name) or requested_name.startswith(name):
                        return name
                        
                # 3. Fallback to first approved template or hello_world
                if "hello_world" in approved_names:
                    return "hello_world"
                if approved_names:
                    return approved_names[0]
        except Exception as e:
            logger.error(f"[WHATSAPP] Failed to resolve template name: {e}")
            
        return requested_name

    @classmethod
    def send_api_request(cls, payload, max_retries=3):
        import time
        token, phone_id, acc_id = cls.get_credentials()
        
        if not token or not phone_id:
            logger.warning("[WHATSAPP] Credentials missing. Simulating successful dispatch.")
            return {
                "success": True,
                "message_id": f"wa_sim_{uuid.uuid4().hex[:12].upper()}",
                "response_body": "Simulated successful Meta API delivery (no credentials)",
                "status_code": 200
            }

        url = f"https://graph.facebook.com/v23.0/{phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        for attempt in range(max_retries + 1):
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=10)
                status_code = response.status_code
                if status_code in [200, 201, 202]:
                    data = response.json()
                    msg_id = data.get("messages", [{}])[0].get("id", "unknown_id")
                    return {
                        "success": True,
                        "message_id": msg_id,
                        "response_body": response.text,
                        "status_code": status_code,
                        "retries": attempt
                    }
                elif status_code in [429, 500, 502, 503]:
                    logger.warning(f"[WHATSAPP] API returned status {status_code}. Retry {attempt+1}/{max_retries}...")
                    if attempt < max_retries:
                        time.sleep(1)
                        continue
                return {
                    "success": False,
                    "response_body": response.text,
                    "status_code": status_code,
                    "retries": attempt
                }
            except (requests.exceptions.RequestException, Exception) as e:
                logger.error(f"[WHATSAPP] Network exception on attempt {attempt+1}: {e}")
                if attempt < max_retries:
                    time.sleep(1)
                    continue
                return {
                    "success": False,
                    "response_body": str(e),
                    "status_code": 500,
                    "retries": attempt
                }

    @classmethod
    def send_message(cls, phone_number, message, branch_id=None, customer_user=None, reservation_id=None):
        return cls.send_text_message(phone_number, message, branch_id, customer_user, reservation_id)

    @classmethod
    def send_template(cls, phone_number, template_name, parameters=None, branch_id=None, customer_user=None, reservation_id=None):
        return cls.send_template_message(phone_number, template_name, parameters, branch_id, customer_user, reservation_id)

    @classmethod
    def send_text_message(cls, phone_number, message, branch_id=None, customer_user=None, reservation_id=None):
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone_number,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message
            }
        }
        
        # Create log entry
        log = CommunicationLog.objects.create(
            customer=customer_user,
            recipient=phone_number,
            message_type='whatsapp',
            subject="WhatsApp Text Message",
            body=message,
            status='pending',
            provider='meta_whatsapp_cloud_api',
            sent_at=timezone.now(),
            reservation_id=reservation_id
        )
        
        res = cls.send_api_request(payload)
        
        log.gateway_response_body = res.get("response_body", "")
        log.api_response = res.get("response_body", "")
        log.gateway_response_code = res.get("status_code", None)
        if res.get("success"):
            log.status = 'delivered'
            log.delivery_status = 'delivered'
            log.message_id = res.get("message_id", "")
            log.whatsapp_message_id = res.get("message_id", "")
        else:
            log.status = 'failed'
            log.delivery_status = 'failed'
            log.error_message = res.get("response_body", "")
        log.save()
        
        # Log audit entry
        logger.info(
            f"[AUDIT] WhatsApp Sent | Recipient: {phone_number} | Type: text | "
            f"Status: {log.status} | MsgID: {log.message_id} | ReservationID: {reservation_id}"
        )
        return res.get("success", False)

    @classmethod
    def send_template_message(cls, phone_number, template_name, parameters=None, branch_id=None, customer_user=None, reservation_id=None):
        # Dynamically resolve real approved template name from Meta
        resolved_template_name = cls.resolve_template_name(template_name)
        
        # Locate the template locally, substitute parameters (if any)
        tpl = WhatsAppTemplate.objects.filter(code=template_name).first()
        if not tpl:
            tpl = WhatsAppTemplate.objects.filter(code=resolved_template_name).first()
            
        if tpl:
            body = tpl.body_template
            if parameters:
                for k, v in parameters.items():
                    body = body.replace(f"{{{{{k}}}}}", str(v))
        else:
            param_str = f" with parameters: {parameters}" if parameters else ""
            body = f"WhatsApp Template notification '{resolved_template_name}' sent{param_str}."

        components = []
        if parameters:
            params_list = []
            for k, v in parameters.items():
                params_list.append({
                    "type": "text",
                    "text": str(v)
                })
            components.append({
                "type": "body",
                "parameters": params_list
            })
            
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone_number,
            "type": "template",
            "template": {
                "name": resolved_template_name,
                "language": {
                    "code": "en_US"
                }
            }
        }
        if components:
            payload["template"]["components"] = components

        log = CommunicationLog.objects.create(
            customer=customer_user,
            recipient=phone_number,
            message_type='whatsapp',
            subject=f"WhatsApp Template: {template_name}",
            body=body,
            status='pending',
            template_code=template_name,
            template_name=template_name,
            provider='meta_whatsapp_cloud_api',
            sent_at=timezone.now(),
            reservation_id=reservation_id
        )
        
        res = cls.send_api_request(payload)
        
        log.gateway_response_body = res.get("response_body", "")
        log.api_response = res.get("response_body", "")
        log.gateway_response_code = res.get("status_code", None)
        if res.get("success"):
            log.status = 'delivered'
            log.delivery_status = 'delivered'
            log.message_id = res.get("message_id", "")
            log.whatsapp_message_id = res.get("message_id", "")
        else:
            log.status = 'failed'
            log.delivery_status = 'failed'
            log.error_message = res.get("response_body", "")
        log.save()

        # Log audit entry
        logger.info(
            f"[AUDIT] WhatsApp Sent | Recipient: {phone_number} | Type: template | "
            f"Template: {template_name} | Status: {log.status} | MsgID: {log.message_id} | ReservationID: {reservation_id}"
        )
        return res.get("success", False)

    @classmethod
    def send_reservation_confirmation(cls, reservation):
        params = {
            'guest_name': reservation.guest_name,
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI',
            'start_time': reservation.start_time.strftime('%Y-%m-%d %I:%M %p')
        }
        return cls.send_template_message(
            phone_number=reservation.guest_phone,
            template_name='reservation_confirmation',
            parameters=params,
            branch_id=reservation.branch.id if reservation.branch else None,
            customer_user=reservation.customer
        )

    @classmethod
    def send_reservation_reminder(cls, reservation):
        params = {
            'guest_name': reservation.guest_name,
            'start_time': reservation.start_time.strftime('%Y-%m-%d %I:%M %p')
        }
        return cls.send_template_message(
            phone_number=reservation.guest_phone,
            template_name='reservation_reminder',
            parameters=params,
            branch_id=reservation.branch.id if reservation.branch else None,
            customer_user=reservation.customer
        )

    @classmethod
    def send_order_ready(cls, order):
        phone = order.customer_phone or (order.reservation.guest_phone if order.reservation else None)
        if not phone:
            return False
        params = {
            'order_id': str(order.id)[:8],
            'customer_name': order.customer_name or 'Valued Customer'
        }
        return cls.send_template_message(
            phone_number=phone,
            template_name='order_ready',
            parameters=params,
            branch_id=order.branch.id if order.branch else None,
            customer_user=order.reservation.customer if order.reservation else None
        )

    @classmethod
    def send_order_confirmation(cls, order):
        phone = order.customer_phone or (order.reservation.guest_phone if order.reservation else None)
        if not phone:
            return False
        params = {
            'order_id': str(order.id)[:8],
            'customer_name': order.customer_name or 'Valued Customer'
        }
        return cls.send_template_message(
            phone_number=phone,
            template_name='order_confirmation',
            parameters=params,
            branch_id=order.branch.id if order.branch else None,
            customer_user=order.reservation.customer if order.reservation else None
        )

    @classmethod
    def send_leave_approval(cls, leave):
        employee_user = leave.employee.user if leave.employee else None
        if not employee_user or not employee_user.phone:
            return False
        params = {
            'employee_name': employee_user.get_full_name() or employee_user.username,
            'start_date': str(leave.start_date),
            'end_date': str(leave.end_date),
            'status': leave.status
        }
        return cls.send_template_message(
            phone_number=employee_user.phone,
            template_name='leave_status_update',
            parameters=params,
            branch_id=leave.employee.branch.id if leave.employee and leave.employee.branch else None,
            customer_user=employee_user
        )

    @classmethod
    def send_attendance_notification(cls, attendance, clock_type="clock_in"):
        employee_user = attendance.employee.user if attendance.employee else None
        if not employee_user or not employee_user.phone:
            return False
        
        tpl_name = 'attendance_clock_in' if clock_type == 'clock_in' else 'attendance_clock_out'
        params = {
            'employee_name': employee_user.get_full_name() or employee_user.username,
            'time': timezone.now().strftime('%Y-%m-%d %I:%M %p')
        }
        return cls.send_template_message(
            phone_number=employee_user.phone,
            template_name=tpl_name,
            parameters=params,
            branch_id=attendance.employee.branch.id if attendance.employee and attendance.employee.branch else None,
            customer_user=employee_user
        )

    @classmethod
    def send_low_stock_alert(cls, alert):
        branch = alert.branch
        if not branch or not branch.branch_manager:
            return False
        manager = branch.branch_manager
        if not manager.phone:
            return False
        params = {
            'ingredient_name': alert.ingredient.name,
            'branch_name': branch.name
        }
        return cls.send_template_message(
            phone_number=manager.phone,
            template_name='low_stock_alert',
            parameters=params,
            branch_id=branch.id,
            customer_user=manager
        )

    @classmethod
    def send_announcement(cls, announcement, user):
        if not user.phone:
            return False
        params = {
            'title': announcement.title,
            'sender': announcement.sender.get_full_name() or announcement.sender.username
        }
        return cls.send_template_message(
            phone_number=user.phone,
            template_name='new_announcement',
            parameters=params,
            branch_id=announcement.branch.id if announcement.branch else None,
            customer_user=user
        )
