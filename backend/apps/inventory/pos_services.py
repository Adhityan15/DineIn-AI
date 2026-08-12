from decimal import Decimal
from django.db import models
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.core.models import Invoice, POSPayment, CashDrawerSession, POSAuditLog
from apps.inventory.models import Order, OrderItem
from apps.reservation.models import Table, Reservation, ReservationTable

class POSAuditService:
    @staticmethod
    def log_action(user, action, details=None, branch=None, request=None):
        """
        Write a security audit log entry.
        """
        ip = None
        device = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            device = request.META.get('HTTP_USER_AGENT', '')[:255]

        POSAuditLog.objects.create(
            branch=branch or (user.branch if user and hasattr(user, 'branch') else None),
            user=user if user and user.is_authenticated else None,
            action=action,
            details=details,
            device=device,
            ip_address=ip
        )


class TableService:
    @staticmethod
    @transaction.atomic
    def transfer_table(from_table, to_table, user=None, request=None):
        """
        Transfers active guest reservation and orders from one table to another.
        """
        if from_table.status != 'occupied':
            raise ValidationError(f"Source table {from_table.number} is not occupied.")
        if to_table.status != 'available':
            raise ValidationError(f"Destination table {to_table.number} is not available.")

        # Find active checkins/seated/dining bookings on source table
        res_table = ReservationTable.objects.filter(
            table=from_table,
            reservation__status__in=['checked_in', 'arrived', 'seated', 'dining']
        ).first()

        if not res_table:
            raise ValidationError(f"No active checkins/seated dining booking found on table {from_table.number}.")

        reservation = res_table.reservation

        # Transfer reservation table mapping
        res_table.table = to_table
        res_table.save()

        # Update table statuses
        from_table.status = 'available'
        from_table.save()
        to_table.status = 'occupied'
        to_table.save()

        # Update any pending or active orders linked to this table
        Order.objects.filter(table=from_table, status__in=['received', 'preparing', 'ready', 'served']).update(table=to_table)

        POSAuditService.log_action(
            user=user,
            action="TRANSFER_TABLE",
            details=f"Transferred Reservation {reservation.id} from Table {from_table.number} to {to_table.number}",
            branch=from_table.branch,
            request=request
        )


    @staticmethod
    @transaction.atomic
    def merge_tables(target_table, source_tables, user=None, request=None):
        """
        Merges multiple active tables under a single host reservation.
        """
        active_res = None
        for tbl in [target_table] + source_tables:
            res_table = ReservationTable.objects.filter(
                table=tbl,
                reservation__status__in=['checked_in', 'arrived', 'seated', 'dining']
            ).first()
            if res_table:
                active_res = res_table.reservation
                break

        if not active_res:
            raise ValidationError("No active dining bookings found on any of the selected tables to merge.")

        # Bind all tables to this active reservation
        for tbl in [target_table] + source_tables:
            tbl.status = 'occupied'
            tbl.save()
            ReservationTable.objects.get_or_create(reservation=active_res, table=tbl)

        POSAuditService.log_action(
            user=user,
            action="MERGE_TABLES",
            details=f"Merged tables {[t.number for t in source_tables]} under Reservation {active_res.id} (Host Table: {target_table.number})",
            branch=target_table.branch,
            request=request
        )


class PaymentService:
    @staticmethod
    @transaction.atomic
    def process_payment(invoice, payment_method, amount, cashier=None, **kwargs):
        """
        Creates a payment record for an invoice.
        """
        return POSPayment.objects.create(
            invoice=invoice,
            payment_method=payment_method,
            amount=Decimal(str(amount)),
            payment_id=kwargs.get('payment_id'),
            transaction_id=kwargs.get('transaction_id'),
            reference_number=kwargs.get('reference_number'),
            gateway=kwargs.get('gateway'),
            cashier=cashier,
            branch=invoice.branch,
            device=kwargs.get('device'),
            status='success',
            approval_code=kwargs.get('approval_code'),
            card_type=kwargs.get('card_type'),
            card_last4=kwargs.get('card_last4'),
            terminal_id=kwargs.get('terminal_id'),
            upi_id=kwargs.get('upi_id'),
            gift_card_number=kwargs.get('gift_card_number'),
            wallet_name=kwargs.get('wallet_name')
        )

    @staticmethod
    @transaction.atomic
    def settle_split_bill(invoice, payments_list, cashier=None, request=None):
        """
        Settles split billing with custom amounts/methods.
        Updates Invoice status when payments cover total.
        """
        total_paid = Decimal('0.00')
        created_payments = []

        for p in payments_list:
            amt = Decimal(str(p['amount']))
            total_paid += amt
            pay_record = PaymentService.process_payment(
                invoice=invoice,
                payment_method=p['payment_method'],
                amount=amt,
                cashier=cashier,
                **p.get('details', {})
            )
            created_payments.append(pay_record)

        # Check tolerance limits
        if total_paid >= invoice.total:
            invoice.status = 'paid'
            invoice.payment_method = 'mixed'
            invoice.save()

            POSAuditService.log_action(
                user=cashier,
                action="SPLIT_BILL_SETTLE",
                details=f"Invoice {invoice.id} settled in split mode. Total paid: {total_paid} of {invoice.total}.",
                branch=invoice.branch,
                request=request
            )
        else:
            invoice.status = 'partially_paid'
            invoice.save()

        return created_payments


class CashDrawerService:
    @staticmethod
    def open_session(branch, cashier, opening_balance, notes=None):
        """
        Opens a new cash drawer session.
        """
        # Ensure no open sessions for this cashier
        active = CashDrawerSession.objects.filter(branch=branch, cashier=cashier, status='open').first()
        if active:
            raise ValidationError("You already have an active cash drawer session open.")

        return CashDrawerSession.objects.create(
            branch=branch,
            cashier=cashier,
            opening_balance=Decimal(str(opening_balance)),
            expected_balance=Decimal(str(opening_balance)),
            status='open',
            notes=notes
        )

    @staticmethod
    def close_session(session, closing_balance, notes=None):
        """
        Closes a cash drawer session, calculating differences.
        """
        if session.status == 'closed':
            raise ValidationError("This drawer session is already closed.")

        # Calculate expected balance based on opening + cash payments logged
        cash_payments_sum = POSPayment.objects.filter(
            invoice__branch=session.branch,
            cashier=session.cashier,
            payment_method='cash',
            timestamp__gte=session.opening_time
        ).aggregate(models_sum=models.Sum('amount'))['models_sum'] or Decimal('0.00')

        # Include split cash transactions
        split_cash_sum = POSPayment.objects.filter(
            invoice__branch=session.branch,
            cashier=session.cashier,
            invoice__payment_method='mixed',
            payment_method='cash',
            timestamp__gte=session.opening_time
        ).aggregate(models_sum=models.Sum('amount'))['models_sum'] or Decimal('0.00')

        expected = session.opening_balance + cash_payments_sum + split_cash_sum
        session.expected_balance = expected
        session.closing_balance = Decimal(str(closing_balance))
        session.difference = session.closing_balance - expected
        session.closing_time = timezone.now()
        session.status = 'closed'
        if notes:
            session.notes = notes
        session.save()
        return session
