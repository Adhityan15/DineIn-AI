import logging
from datetime import datetime, time, timedelta
from django.db import transaction
from django.db.models import Q, F, Avg, ExpressionWrapper, DurationField
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.core.mail import send_mail
from django.conf import settings
from apps.core.models import Branch
from apps.reservation.models import Table, Reservation, ReservationTable, Waitlist, ReservationHistory

logger = logging.getLogger('dinein.reservation')

from apps.notifications.services import EmailService

class NotificationService:
    """
    Handles dispatching system notifications for reservation events by routing
    to the centralized orchestrator asynchronously via Celery.
    """
    @classmethod
    def send_reservation_confirmation(cls, reservation):
        from apps.reservation.tasks import send_reservation_notifications_task
        send_reservation_notifications_task.delay(str(reservation.id), 'created')

    @classmethod
    def send_reservation_approved(cls, reservation):
        from apps.reservation.tasks import send_reservation_notifications_task
        send_reservation_notifications_task.delay(str(reservation.id), 'confirmed')

    @classmethod
    def send_reservation_rejected(cls, reservation):
        from apps.reservation.tasks import send_reservation_notifications_task
        send_reservation_notifications_task.delay(str(reservation.id), 'rejected')

    @classmethod
    def send_reservation_cancelled(cls, reservation):
        from apps.reservation.tasks import send_reservation_notifications_task
        send_reservation_notifications_task.delay(str(reservation.id), 'cancelled')

    @classmethod
    def send_reservation_reminder(cls, reservation, reminder_type='2h', hours_before=None):
        if hours_before is not None:
            if hours_before == 24:
                reminder_type = '24h'
            elif hours_before == 2:
                reminder_type = '2h'
            else:
                reminder_type = '30m'
        from apps.reservation.tasks import send_reservation_notifications_task
        send_reservation_notifications_task.delay(str(reservation.id), 'reminder', reminder_type=reminder_type)

    @classmethod
    def send_reservation_welcome(cls, reservation):
        from apps.reservation.tasks import send_reservation_notifications_task
        send_reservation_notifications_task.delay(str(reservation.id), 'welcome')

    @classmethod
    def send_reservation_thank_you(cls, reservation):
        from apps.reservation.tasks import send_reservation_notifications_task
        send_reservation_notifications_task.delay(str(reservation.id), 'thank_you')

    @classmethod
    def send_reservation_rescheduled(cls, reservation):
        from apps.reservation.tasks import send_reservation_notifications_task
        send_reservation_notifications_task.delay(str(reservation.id), 'modified')

    @staticmethod
    def send_waitlist_alert(waitlist_entry):
        logger.info(f"[NOTIF] Dispatched 'Table Ready' alert to waitlist guest {waitlist_entry.guest_name}")

    @classmethod
    def validate_whatsapp_recipient(cls, reservation):
        """
        Validates recipient details before triggering WhatsApp notification.
        Returns (is_valid, reason)
        """
        phone = reservation.guest_phone or (reservation.customer.phone if (reservation.customer and hasattr(reservation.customer, 'phone')) else None)
        if not phone:
            return False, "Recipient phone number is missing"
            
        # Format validation
        clean_phone = phone.strip().replace(" ", "").replace("-", "")
        if not (clean_phone.startswith("+") or clean_phone.isdigit()):
            return False, f"Invalid phone format: {phone}"
            
        if len(clean_phone) < 10:
            return False, f"Phone number too short: {phone}"
            
        # Country code validation
        if clean_phone.startswith("+"):
            if len(clean_phone) < 11:
                return False, f"Missing or invalid country code: {phone}"
        else:
            if len(clean_phone) == 10:
                return False, f"Phone number lacks country code: {phone}"
                
        # Check if customer has WhatsApp enabled (default to True if attribute doesn't exist)
        customer = reservation.customer
        if customer and hasattr(customer, 'whatsapp_enabled') and not customer.whatsapp_enabled:
            return False, f"WhatsApp notifications are disabled for customer: {customer.username}"
            
        return True, "Valid"

    @staticmethod
    def _audit_log(reservation, action, notif_type, status, response_text):
        try:
            from apps.core.models import AuditLog
            from django.utils import timezone
            AuditLog.objects.create(
                user=reservation.customer,
                action=action,
                model_name="Reservation",
                record_id=str(reservation.id),
                new_value={
                    "reservation_id": str(reservation.id),
                    "customer": reservation.guest_name,
                    "notification_type": notif_type,
                    "status": status,
                    "timestamp": timezone.now().isoformat(),
                    "api_response": response_text
                }
            )
        except Exception as e:
            logger.error(f"Failed to create AuditLog entry: {e}")

    @classmethod
    def send_reservation_notifications(cls, reservation, event_type, reminder_type='2h'):
        """
        Orchestration method to send Email, WhatsApp, and In-App notifications.
        All channels are executed independently and failures are handled gracefully.
        """
        from apps.notifications.services import EmailService
        from apps.notifications.services.whatsapp_service import WhatsAppService
        from django.conf import settings
        from django.utils import timezone
        
        email_success = False
        email_error = None
        
        # 1. Send Email
        try:
            if event_type == 'created':
                EmailService.send_reservation_confirmation(reservation)
            elif event_type == 'confirmed':
                EmailService.send_reservation_approved(reservation)
            elif event_type == 'cancelled':
                EmailService.send_reservation_cancelled(reservation)
            elif event_type == 'modified':
                EmailService.send_reservation_rescheduled(reservation)
            elif event_type == 'reminder':
                EmailService.send_reservation_reminder(reservation, reminder_type)
            elif event_type == 'welcome':
                EmailService.send_reservation_welcome(reservation)
            elif event_type == 'thank_you':
                EmailService.send_reservation_thank_you(reservation)
            elif event_type == 'rejected':
                EmailService.send_reservation_rejected(reservation)
                
            email_success = True
            cls._audit_log(reservation, "Reservation Email Sent", "email", "sent", "250 2.0.0 OK")
        except Exception as e:
            email_error = str(e)
            logger.error(f"Reservation {event_type} email failed: {e}")
            cls._audit_log(reservation, "Reservation Email Failed", "email", "failed", str(e))
            
        # Write Email history log
        try:
            from apps.notifications.models import InAppNotification
            InAppNotification.objects.create(
                user=reservation.customer,
                title=f"Reservation #{str(reservation.id)[:8].upper()}",
                message=f"Sent email confirmation to {reservation.guest_email}" if email_success else f"Failed to send email to {reservation.guest_email}: {email_error}",
                notification_type="email",
                module="reservation",
                recipient=reservation.guest_email or 'N/A',
                delivery_status="delivered" if email_success else "failed",
                branch=reservation.branch,
                status='unread'
            )
        except Exception as ex:
            logger.error(f"Failed to create Email history log: {ex}")

        # 2. Validate phone number for WhatsApp
        wa_success = False
        wa_error = None
        wa_api_resp = "N/A"
        
        phone_valid, validation_reason = cls.validate_whatsapp_recipient(reservation)
        
        if phone_valid:
            # 3. Send WhatsApp
            try:
                template_map = {
                    'created': 'reservation_created',
                    'confirmed': 'reservation_confirmed',
                    'cancelled': 'reservation_cancelled',
                    'modified': 'reservation_modified',
                    'reminder': 'reservation_reminder',
                }
                template_name = template_map.get(event_type, 'reservation_created')
                
                resolved_name = WhatsAppService.resolve_template_name(template_name)
                table_nums = [str(rt.table.number) for rt in reservation.reservation_tables.all()]
                table_str = f"Table {', '.join(table_nums)}" if table_nums else "Auto-assigned"
                
                if "jaspers_market" in resolved_name or resolved_name == "hello_world":
                    parameters = {
                        "customer_name": reservation.guest_name,
                        "booking_id": str(reservation.id)[:8].upper(),
                        "details": f"{event_type.capitalize()} - {reservation.start_time.strftime('%Y-%m-%d %I:%M %p')} at {reservation.branch.name if reservation.branch else 'DineIn AI'}"
                    }
                else:
                    parameters = {
                        "customer_name": reservation.guest_name,
                        "reservation_date": reservation.start_time.strftime('%Y-%m-%d'),
                        "reservation_time": reservation.start_time.strftime('%I:%M %p'),
                        "table_number": table_str,
                        "restaurant_name": reservation.branch.name if reservation.branch else 'DineIn AI'
                    }
                
                phone = reservation.guest_phone or (reservation.customer.phone if hasattr(reservation.customer, 'phone') else None)
                wa_success = WhatsAppService.send_template_message(
                    phone_number=phone,
                    template_name=template_name,
                    parameters=parameters,
                    branch_id=reservation.branch_id,
                    customer_user=reservation.customer,
                    reservation_id=str(reservation.id)
                )
                
                from apps.notifications.models import CommunicationLog
                log = CommunicationLog.objects.filter(recipient=phone, message_type='whatsapp').order_by('-created_at').first()
                wa_api_resp = log.api_response if log else "Simulated Meta API response"
                
                if wa_success:
                    cls._audit_log(reservation, "Reservation WhatsApp Sent", "whatsapp", "sent", wa_api_resp)
                else:
                    wa_error = wa_api_resp
                    cls._audit_log(reservation, "Reservation WhatsApp Failed", "whatsapp", "failed", wa_api_resp)
            except Exception as e:
                wa_error = str(e)
                logger.error(f"Reservation {event_type} WhatsApp failed: {e}")
                cls._audit_log(reservation, "Reservation WhatsApp Failed", "whatsapp", "failed", str(e))
        else:
            wa_error = validation_reason
            logger.warning(f"[WHATSAPP] Recipient phone validation failed: {validation_reason}")
            cls._audit_log(reservation, "Reservation WhatsApp Failed", "whatsapp", "failed", f"Validation failed: {validation_reason}")
            
        # Write WhatsApp history log
        try:
            phone = reservation.guest_phone or (reservation.customer.phone if (reservation.customer and hasattr(reservation.customer, 'phone')) else '')
            from apps.notifications.models import InAppNotification
            InAppNotification.objects.create(
                user=reservation.customer,
                title=f"Reservation #{str(reservation.id)[:8].upper()}",
                message=f"Sent WhatsApp notification to {phone}" if wa_success else f"Failed to send WhatsApp to {phone}: {wa_error}",
                notification_type="whatsapp",
                module="reservation",
                recipient=phone or 'N/A',
                delivery_status="delivered" if wa_success else "failed",
                branch=reservation.branch,
                status='unread'
            )
        except Exception as ex:
            logger.error(f"Failed to create WhatsApp history log: {ex}")
            
        # 4. Create In-App system dashboard notification
        try:
            from apps.notifications.models import InAppNotification
            InAppNotification.objects.create(
                user=reservation.customer,
                title=f"Reservation #{str(reservation.id)[:8].upper()}",
                message=f"Reservation {event_type} successfully.",
                notification_type="system",
                module="reservation",
                recipient=reservation.guest_name,
                delivery_status="delivered",
                branch=reservation.branch,
                status='unread'
            )
        except Exception as ex:
            logger.error(f"Failed to create In-App notification log: {ex}")


class AvailabilityService:
    """
    Business service handles table availability computations, business hours validation,
    and alternative time recommendations.
    """
    BUSINESS_START_HOUR = 11  # 11:00 AM
    BUSINESS_END_HOUR = 23    # 11:00 PM
    DEFAULT_DURATION_HOURS = 2

    @classmethod
    def is_within_business_hours(cls, dt):
        """
        Check if datetime falls within business hours (11:00 AM to 11:00 PM).
        """
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        tz_time = timezone.localtime(dt).time()
        start = time(cls.BUSINESS_START_HOUR, 0)
        end = time(cls.BUSINESS_END_HOUR, 0)
        return start <= tz_time <= end

    @classmethod
    def get_overlapping_reservations(cls, start_time, end_time, branch_id, exclude_reservation_id=None):
        """
        Query reservations that overlap with the target time slot.
        """
        qs = Reservation.objects.filter(
            branch_id=branch_id,
            status__in=['confirmed', 'reminder_sent', 'checked_in', 'seated'],
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        if exclude_reservation_id:
            qs = qs.exclude(id=exclude_reservation_id)
        return qs

    @classmethod
    def find_available_tables(cls, branch_id, start_time, end_time, party_size, exclude_reservation_id=None):
        """
        Identify physical tables that are free and can satisfy the party size.
        """
        # 1. Fetch all active tables in branch
        all_tables = Table.objects.filter(branch_id=branch_id).exclude(status='out_of_service')
        if not all_tables.exists():
            return []

        # 2. Identify occupied tables during this period
        overlaps = cls.get_overlapping_reservations(start_time, end_time, branch_id, exclude_reservation_id)
        occupied_table_ids = ReservationTable.objects.filter(
            reservation__in=overlaps
        ).values_list('table_id', flat=True)

        # 3. Filter free tables
        free_tables = all_tables.exclude(id__in=occupied_table_ids)
        return free_tables

    @classmethod
    def suggest_alternative_slots(cls, branch_id, start_time, party_size, window_minutes=60):
        """
        Suggest nearby open slots if the primary request fails availability checks.
        """
        suggestions = []
        # Check every 30 mins interval in window
        offsets = [-60, -30, 30, 60]
        for offset in offsets:
            alt_start = start_time + timedelta(minutes=offset)
            alt_end = alt_start + timedelta(hours=cls.DEFAULT_DURATION_HOURS)
            
            if not cls.is_within_business_hours(alt_start) or not cls.is_within_business_hours(alt_end):
                continue
                
            free_tables = cls.find_available_tables(branch_id, alt_start, alt_end, party_size)
            allocated = TableAllocationService.allocate_tables(free_tables, party_size)
            
            if allocated:
                suggestions.append({
                    'start_time': alt_start.isoformat(),
                    'end_time': alt_end.isoformat(),
                    'tables': [t.number for t in allocated]
                })
        return suggestions


class TableAllocationService:
    """
    Business service handles optimal table mappings based on capacity constraints
    and coordinates-based table joining heuristics.
    """
    @staticmethod
    def allocate_tables(free_tables, party_size):
        """
        Greedy table allocation. Matches smallest available table capacity first.
        If no single table satisfies, attempts combinations of adjacent tables.
        """
        # 1. Check for single table fit
        sorted_tables = sorted(free_tables, key=lambda t: t.capacity)
        for table in sorted_tables:
            if table.capacity >= party_size:
                return [table]  # Optimal single table match

        # 2. Check for combined tables (Support multi-table combinations based on distance coordinates <= 100 units)
        # Sort desc to check large table groups first
        combined_candidates = []
        for i, t1 in enumerate(sorted_tables):
            current_combo = [t1]
            current_capacity = t1.capacity
            
            for j, t2 in enumerate(sorted_tables):
                if i == j:
                    continue
                # Distance checking heuristic
                dist = ((t1.x_coord - t2.x_coord)**2 + (t1.y_coord - t2.y_coord)**2)**0.5
                if dist <= 150: # Table connection adjacency limit
                    current_combo.append(t2)
                    current_capacity += t2.capacity
                    if current_capacity >= party_size:
                        combined_candidates.append((current_combo, current_capacity))
                        break
            
        if combined_candidates:
            # Return combo with minimum wasted seats
            best_combo = min(combined_candidates, key=lambda x: (x[1] - party_size, len(x[0])))
            return best_combo[0]

        return []  # No allocation fits


class ReservationService:
    """
    Core engine handling reservation state operations and transaction guarantees.
    """
    @staticmethod
    def log_history(reservation, status, user=None, reason=None):
        """
        Logs a status transition to the ReservationHistory database table.
        """
        ReservationHistory.objects.create(
            reservation=reservation,
            status=status,
            changed_by=user,
            reason=reason
        )

    @staticmethod
    @transaction.atomic
    def create_reservation(branch_id, guest_name, guest_phone, guest_email=None, party_size=1, 
                           start_time=None, notes=None, customer=None, is_walk_in=False, status='pending', **attributes):
        """
        Creates and confirms a booking, ensuring zero double-booking race conditions.
        """
        # 1. Validate Business hour rules
        if not start_time:
            raise ValidationError("Start time must be provided.")
        if timezone.is_naive(start_time):
            start_time = timezone.make_aware(start_time)
        end_time = start_time + timedelta(hours=AvailabilityService.DEFAULT_DURATION_HOURS)

        if not AvailabilityService.is_within_business_hours(start_time):
            raise ValidationError("Reservation time is outside operational business hours (11:00 AM - 11:00 PM).")

        if party_size <= 0:
            raise ValidationError("Party size must be greater than zero.")

        # 2. Check availability with transaction locks to prevent concurrency conflicts
        branch = Branch.objects.select_for_update().get(id=branch_id)
        
        free_tables = AvailabilityService.find_available_tables(
            branch_id=branch_id,
            start_time=start_time,
            end_time=end_time,
            party_size=party_size
        )

        allocated_tables = TableAllocationService.allocate_tables(free_tables, party_size)
        
        if not allocated_tables:
            alternatives = AvailabilityService.suggest_alternative_slots(branch_id, start_time, party_size)
            raise ValidationError({
                "non_field_errors": "No available tables found for requested slot.",
                "suggested_slots": alternatives
            })

        # 3. Construct reservation
        # Default status for walk-in is 'seated' or 'confirmed'
        if is_walk_in and status == 'pending':
            status = 'confirmed'

        reservation = Reservation.objects.create(
            branch=branch,
            customer=customer,
            guest_name=guest_name,
            guest_phone=guest_phone,
            guest_email=guest_email,
            party_size=party_size,
            start_time=start_time,
            end_time=end_time,
            status=status,
            notes=notes,
            is_walk_in=is_walk_in,
            **attributes
        )

        # 4. Associate tables via junction model
        for table in allocated_tables:
            ReservationTable.objects.create(reservation=reservation, table=table)

        # 5. Log history and send confirmation email
        ReservationService.log_history(reservation, status, user=customer, reason="Reservation booked via client portal.")
        transaction.on_commit(lambda: NotificationService.send_reservation_confirmation(reservation))
        return reservation

    @staticmethod
    @transaction.atomic
    def modify_reservation(reservation_id, user=None, **updates):
        """
        Modify time, party size, or notes of an existing booking, recalculating table conflict rules.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        
        if reservation.status in ['completed', 'cancelled', 'no_show']:
            raise ValidationError("Cannot modify an inactive reservation.")

        branch_id = updates.get('branch_id', reservation.branch.id)
        start_time = updates.get('start_time', reservation.start_time)
        if start_time and timezone.is_naive(start_time):
            start_time = timezone.make_aware(start_time)
        end_time = start_time + timedelta(hours=AvailabilityService.DEFAULT_DURATION_HOURS)
        party_size = updates.get('party_size', reservation.party_size)

        # Re-evaluate tables allocation only if time or party size has changed
        time_changed = start_time != reservation.start_time
        size_changed = party_size != reservation.party_size

        if time_changed or size_changed:
            if not AvailabilityService.is_within_business_hours(start_time):
                raise ValidationError("Updated reservation window falls outside operational hours.")

            free_tables = AvailabilityService.find_available_tables(
                branch_id=branch_id,
                start_time=start_time,
                end_time=end_time,
                party_size=party_size,
                exclude_reservation_id=reservation.id
            )
            allocated_tables = TableAllocationService.allocate_tables(free_tables, party_size)

            if not allocated_tables:
                raise ValidationError("No available tables accommodate these changes at this time slot.")

            # Update mappings
            ReservationTable.objects.filter(reservation=reservation).delete()
            for table in allocated_tables:
                ReservationTable.objects.create(reservation=reservation, table=table)

            reservation.start_time = start_time
            reservation.end_time = end_time
            reservation.party_size = party_size

        # Simple metadata updates
        if 'guest_name' in updates: reservation.guest_name = updates['guest_name']
        if 'guest_phone' in updates: reservation.guest_phone = updates['guest_phone']
        if 'guest_email' in updates: reservation.guest_email = updates['guest_email']
        if 'notes' in updates: reservation.notes = updates['notes']
        if 'status' in updates: reservation.status = updates['status']
        if 'internal_notes' in updates: reservation.internal_notes = updates['internal_notes']
        
        # Optional attributes
        for attr in ['is_birthday', 'is_anniversary', 'is_vip', 'needs_wheelchair', 'needs_baby_chair', 'allergy_notes', 'special_requests']:
            if attr in updates:
                setattr(reservation, attr, updates[attr])

        reservation.save()
        ReservationService.log_history(reservation, reservation.status, user=user, reason="Reservation fields adjusted.")
        
        if time_changed:
            try:
                transaction.on_commit(lambda: NotificationService.send_reservation_rescheduled(reservation))
            except Exception as e:
                logger.error(f"Failed to send reschedule notification: {e}")
                
        return reservation

    @staticmethod
    @transaction.atomic
    def approve_reservation(reservation_id, user=None, reason=None):
        """
        Transition reservation to Confirmed state.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        if reservation.status != 'pending':
            return reservation

        reservation.status = 'confirmed'
        if reason:
            reservation.internal_notes = f"{reservation.internal_notes or ''}\nApproval note: {reason}".strip()
        reservation.save()

        # Flag physical tables as reserved
        tables = [rt.table for rt in reservation.reservation_tables.all()]
        for table in tables:
            table.status = 'reserved'
            table.save()

        ReservationService.log_history(reservation, 'confirmed', user=user, reason=reason or "Booking approved by staff.")
        transaction.on_commit(lambda: NotificationService.send_reservation_approved(reservation))
        return reservation

    @staticmethod
    @transaction.atomic
    def reject_reservation(reservation_id, user=None, reason=None):
        """
        Transition reservation to Rejected state and free associated tables.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        if reservation.status in ['completed', 'cancelled', 'no_show', 'rejected']:
            raise ValidationError("Cannot reject an inactive reservation.")

        reservation.status = 'rejected'
        reservation.rejected_by = user
        reservation.rejected_at = timezone.now()
        reservation.rejection_reason = reason
        reservation.save()

        # Free associated tables
        ReservationTable.objects.filter(reservation=reservation).delete()

        ReservationService.log_history(reservation, 'rejected', user=user, reason=reason or "Booking rejected by staff.")
        transaction.on_commit(lambda: NotificationService.send_reservation_rejected(reservation))
        return reservation

    @staticmethod
    @transaction.atomic
    def cancel_reservation(reservation_id, user=None, reason=None):
        """
        Cancel a booking, releasing table locks.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        if reservation.status == 'cancelled':
            return reservation
            
        reservation.status = 'cancelled'
        reservation.cancelled_by = user
        reservation.cancelled_at = timezone.now()
        reservation.cancellation_reason = reason
        reservation.save()
        
        # Free associated tables
        ReservationTable.objects.filter(reservation=reservation).delete()
        
        ReservationService.log_history(reservation, 'cancelled', user=user, reason=reason or "Booking cancelled.")
        transaction.on_commit(lambda: NotificationService.send_reservation_cancelled(reservation))
        return reservation

    @staticmethod
    @transaction.atomic
    def check_in_guest(reservation_id, user=None):
        """
        Transitions reservation status to 'arrived' and flags physical tables as occupied.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        if reservation.status in ['cancelled', 'no_show', 'rejected']:
            raise ValidationError("Cannot check in a cancelled, rejected, or no-show reservation.")
            
        reservation.status = 'arrived'
        reservation.save()
        
        # Table Occupied when Checked In
        tables = [rt.table for rt in reservation.reservation_tables.all()]
        for table in tables:
            table.status = 'occupied'
            table.save()
        
        ReservationService.log_history(reservation, 'arrived', user=user, reason="Guest arrived and checked in at host station.")
        try:
            transaction.on_commit(lambda: NotificationService.send_reservation_welcome(reservation))
        except Exception as e:
            logger.error(f"Failed to send welcome email upon check-in: {e}")
        return reservation

    @staticmethod
    @transaction.atomic
    def seat_guest(reservation_id, user=None):
        """
        Transitions guest from arrived to seated and ensures table status is occupied.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        if reservation.status in ['cancelled', 'no_show', 'rejected']:
            raise ValidationError("Cannot seat an inactive reservation.")

        reservation.status = 'seated'
        reservation.save()

        # Flag physical tables as occupied
        tables = [rt.table for rt in reservation.reservation_tables.all()]
        for table in tables:
            table.status = 'occupied'
            table.save()

        ReservationService.log_history(reservation, 'seated', user=user, reason="Guest seated at assigned dining table.")
        return reservation

    @staticmethod
    @transaction.atomic
    def start_dining(reservation_id, user=None):
        """
        Transitions guest from seated to dining and notifies.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        reservation.status = 'dining'
        reservation.save()

        # Flag physical tables as occupied
        tables = [rt.table for rt in reservation.reservation_tables.all()]
        for table in tables:
            table.status = 'occupied'
            table.save()

        ReservationService.log_history(reservation, 'dining', user=user, reason="Dining session started. Food service is active.")
        try:
            transaction.on_commit(lambda: NotificationService.send_reservation_table_ready(reservation))
        except Exception as e:
            logger.error(f"Failed to send table ready email: {e}")
        return reservation

    @staticmethod
    @transaction.atomic
    def request_checkout(reservation_id, user=None):
        """
        Transitions guest status to 'checkout_requested'.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        reservation.status = 'checkout_requested'
        reservation.save()

        ReservationService.log_history(reservation, 'checkout_requested', user=user, reason="Checkout requested by guest or waiter.")
        return reservation

    @staticmethod
    @transaction.atomic
    def check_out_guest(reservation_id, user=None):
        """
        Transitions reservation status to 'completed' and releases physical tables to cleaning.
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        reservation.status = 'completed'
        reservation.save()
        
        # Release physical tables to cleaning status
        tables = [rt.table for rt in reservation.reservation_tables.all()]
        for table in tables:
            table.status = 'cleaning'
            table.save()

        # Trigger table cleaning timer (e.g. 10 seconds for instant synchronization test)
        try:
            from apps.reservation.tasks import complete_table_cleaning
            for table in tables:
                complete_table_cleaning.apply_async(args=[table.id], countdown=10)
        except Exception as e:
            # Fallback for dev mode without worker
            import threading
            def delayed_cleanup():
                import time
                time.sleep(10)
                from django.db import connections
                connections.close_all()
                from apps.reservation.models import Table
                for t in tables:
                    for attempt in range(5):
                        try:
                            tbl = Table.objects.get(id=t.id)
                            if tbl.status == 'cleaning':
                                tbl.status = 'available'
                                tbl.save()
                            break
                        except Exception as ex:
                            logger.error(f"[CLEANING THREAD] Attempt {attempt} failed: {ex}")
                            time.sleep(1)
            threading.Thread(target=delayed_cleanup, daemon=True).start()

        ReservationService.log_history(reservation, 'completed', user=user, reason="Dining session completed. Guest checked out.")
        try:
            transaction.on_commit(lambda: NotificationService.send_reservation_thank_you(reservation))
        except Exception as e:
            logger.error(f"Failed to send checkout thank you email: {e}")

        # Queue feedback request email in 30 minutes (1800 seconds)
        try:
            from apps.notifications.tasks import send_delayed_feedback_request
            send_delayed_feedback_request.apply_async(args=[str(reservation.id)], countdown=1800)
            logger.info(f"Queued delayed feedback request celery task for reservation {reservation.id}")
        except Exception as e:
            logger.error(f"Failed to queue delayed feedback request task: {e}")

        return reservation

    @staticmethod
    @transaction.atomic
    def no_show_guest(reservation_id, user=None, reason=None):
        """
        Marks reservation as No Show and releases physical tables (preserving junction records for history).
        """
        reservation = Reservation.objects.select_for_update().get(id=reservation_id)
        if reservation.status in ['completed', 'cancelled', 'no_show', 'rejected']:
            raise ValidationError("Cannot mark an inactive reservation as no show.")

        reservation.status = 'no_show'
        reservation.save()

        # Release tables (set status to available)
        for res_table in reservation.reservation_tables.all():
            table = res_table.table
            table.status = 'available'
            table.save()

        ReservationService.log_history(reservation, 'no_show', user=user, reason=reason or "Guest failed to arrive within grace window.")
        return reservation

    @staticmethod
    @transaction.atomic
    def quick_walk_in_seat(branch_id, table_id, party_size, guest_name=None, guest_phone=None, user=None):
        """
        Flow A: Quick Walk-In
        Immediately seats walk-in customer: creates reservation (status='dining'),
        allocates table (status='occupied'), and initiates a dining session (Order).
        """
        from apps.reservation.models import Table, ReservationTable, Reservation
        from apps.inventory.models import Order
        from django.utils import timezone
        
        table = Table.objects.select_for_update().get(id=table_id, branch_id=branch_id)
        if table.status != 'available':
            raise ValidationError(f"Table {table.number} is not available (current status: {table.status}).")
            
        if party_size <= 0:
            raise ValidationError("Party size must be greater than zero.")
            
        guest_name = guest_name or "Walk-In Customer"
        guest_phone = guest_phone or "+910000000000"
        
        start = timezone.now()
        end = start + timedelta(hours=AvailabilityService.DEFAULT_DURATION_HOURS)
        
        reservation = Reservation.objects.create(
            branch_id=branch_id,
            guest_name=guest_name,
            guest_phone=guest_phone,
            party_size=party_size,
            start_time=start,
            end_time=end,
            status='dining',
            is_walk_in=True
        )
        
        ReservationTable.objects.create(reservation=reservation, table=table)
        table.status = 'occupied'
        table.save()
        
        Order.objects.create(
            branch_id=branch_id,
            reservation=reservation,
            customer_name=guest_name,
            customer_phone=guest_phone,
            status='preparing',
            total_amount=0.00
        )
        
        ReservationService.log_history(reservation, 'dining', user=user, reason="Quick walk-in dining session started.")
        try:
            transaction.on_commit(lambda: NotificationService.send_reservation_confirmation(reservation))
        except Exception as e:
            logger.error(f"Failed to send confirmation alerts for quick walk-in: {e}")
        return reservation


class WaitlistService:
    """
    Business service handles waitlist queues, turnover-based estimated wait times,
    and automatic waitlist promotions.
    """
    DEFAULT_TURNOVER_MINUTES = 90

    @classmethod
    def get_average_turnover_minutes(cls, branch_id):
        """
        Heuristic: Calculate average dining duration from completed bookings.
        Fallbacks to default 90 minutes if there are no records.
        """
        avg_diff = Reservation.objects.filter(
            branch_id=branch_id,
            status='completed'
        ).annotate(
            duration=ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())
        ).aggregate(Avg('duration'))

        if avg_diff['duration__avg']:
            return int(avg_diff['duration__avg'].total_seconds() / 60)
        return cls.DEFAULT_TURNOVER_MINUTES

    @classmethod
    def calculate_estimated_wait(cls, branch_id, party_size):
        """
         Turnover-based wait time formula:
         Wait = (QueuePosition * AvgTurnover) / (MatchingCapacityTablesCount)
        """
        # Find matching tables for size
        matching_tables_count = Table.objects.filter(
            branch_id=branch_id,
            capacity__gte=party_size
        ).exclude(status='out_of_service').count()

        if matching_tables_count == 0:
            return 120  # Fallback ceiling

        active_waiting = Waitlist.objects.filter(
            branch_id=branch_id,
            status='waiting'
        ).count()

        avg_turnover = cls.get_average_turnover_minutes(branch_id)
        estimated_minutes = int(((active_waiting + 1) * avg_turnover) / matching_tables_count)
        return max(15, estimated_minutes)  # Minimum wait floor is 15 minutes

    @classmethod
    @transaction.atomic
    def join_waitlist(cls, branch_id, guest_name, guest_phone, guest_email=None, party_size=1):
        """
        Add a customer to the virtual queue.
        """
        if party_size <= 0:
            raise ValidationError("Party size must be greater than zero.")
            
        # Get next queue position
        last_position = Waitlist.objects.filter(
            branch_id=branch_id,
            status='waiting'
        ).order_by('-position').first()
        
        next_pos = (last_position.position + 1) if last_position else 1
        wait_est = cls.calculate_estimated_wait(branch_id, party_size)

        entry = Waitlist.objects.create(
            branch_id=branch_id,
            guest_name=guest_name,
            guest_phone=guest_phone,
            guest_email=guest_email,
            party_size=party_size,
            position=next_pos,
            status='waiting',
            estimated_wait_minutes=wait_est
        )
        return entry

    @classmethod
    @transaction.atomic
    def notify_guest(cls, waitlist_id):
        """
        Flags a waitlist entry as notified, dispatching alert placeholders.
        """
        entry = Waitlist.objects.select_for_update().get(id=waitlist_id)
        if entry.status != 'waiting':
            raise ValidationError("Only waiting entries can be notified.")
            
        entry.status = 'notified'
        entry.notified_at = timezone.now()
        entry.save()
        
        NotificationService.send_waitlist_alert(entry)
        return entry

    @classmethod
    @transaction.atomic
    def promote_and_check_in(cls, waitlist_id, table_ids):
        """
        Check in a notified waitlist guest, mapping them to selected tables
        and updating layout state.
        """
        entry = Waitlist.objects.select_for_update().get(id=waitlist_id)
        if entry.status not in ['waiting', 'notified']:
            raise ValidationError("Cannot promote an entry that is not active in the queue.")

        tables = Table.objects.filter(id__in=table_ids, status='available')
        if not tables.exists():
            raise ValidationError("Target tables must be available to check in guest.")

        total_capacity = sum(t.capacity for t in tables)
        if total_capacity < entry.party_size:
            raise ValidationError("Selected tables do not accommodate the guest's party size.")

        # Create reservation record
        start = timezone.now()
        end = start + timedelta(hours=AvailabilityService.DEFAULT_DURATION_HOURS)

        reservation = Reservation.objects.create(
            branch=entry.branch,
            guest_name=entry.guest_name,
            guest_phone=entry.guest_phone,
            guest_email=entry.guest_email,
            party_size=entry.party_size,
            start_time=start,
            end_time=end,
            status='seated',
            is_walk_in=True
        )

        for table in tables:
            ReservationTable.objects.create(reservation=reservation, table=table)
            table.status = 'occupied'
            table.save()

        # Update waitlist status
        entry.status = 'checked_in'
        entry.save()

        # Recalculate remaining waitlist positions
        cls._reorder_queue_positions(entry.branch.id)
        return reservation

    @classmethod
    @transaction.atomic
    def cancel_waitlist(cls, waitlist_id):
        """
        Remove guest from waitlist queue.
        """
        entry = Waitlist.objects.select_for_update().get(id=waitlist_id)
        entry.status = 'cancelled'
        entry.save()
        
        cls._reorder_queue_positions(entry.branch.id)
        return entry

    @classmethod
    @transaction.atomic
    def expire_waitlist_entry(cls, waitlist_id):
        """
        Auto expire a notified group that failed to report.
        """
        entry = Waitlist.objects.select_for_update().get(id=waitlist_id)
        if entry.status != 'notified':
            raise ValidationError("Only notified entries can be expired.")
            
        entry.status = 'expired'
        entry.save()
        
        cls._reorder_queue_positions(entry.branch.id)
        return entry

    @classmethod
    def _reorder_queue_positions(cls, branch_id):
        """
        Reorders positions of remaining active waitlist entries.
        """
        waiting_entries = Waitlist.objects.filter(
            branch_id=branch_id,
            status='waiting'
        ).order_by('joined_at')
        
        for idx, entry in enumerate(waiting_entries):
            entry.position = idx + 1
            entry.save()
