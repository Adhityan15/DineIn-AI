from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from apps.core.models import Invoice, AuditLog
from apps.inventory.services import InventoryService
from apps.authentication.models import LoyaltyProfile, User

class InvoiceService:
    @staticmethod
    def process_refund(invoice, user, ip_address=None):
        if invoice.status != 'paid':
            raise ValidationError("Only paid invoices can be refunded.")
            
        with transaction.atomic():
            # 1. Update invoice status
            invoice.status = 'refunded'
            invoice.save()
            
            # 2. Update order status and restore inventory
            order = invoice.order
            if order:
                order.status = 'refunded'
                order.save()
                
                InventoryService.restore_ingredients_for_order(order, user=user)
                
                # Deduct loyalty points awarded earlier
                if order.customer_phone:
                    db_user = User.objects.filter(
                        Q(phone=order.customer_phone) | Q(email=order.customer_phone) | Q(username=order.customer_phone)
                    ).first()
                    if db_user:
                        loyalty = LoyaltyProfile.objects.filter(user=db_user).first()
                        if loyalty:
                            points_to_remove = int(invoice.total // 10)
                            loyalty.points = max(0, loyalty.points - points_to_remove)
                            # Re-calculate tier
                            if loyalty.points > 1000:
                                loyalty.tier = 'platinum'
                            elif loyalty.points > 500:
                                loyalty.tier = 'gold'
                            else:
                                loyalty.tier = 'silver'
                            loyalty.save()
                            
                # Ensure tables are released
                if order.table:
                    order.table.status = 'available'
                    order.table.save()
                    
                if order.reservation:
                    res = order.reservation
                    res.status = 'refunded'
                    res.save()
                    for rt in res.reservation_tables.all():
                        rt.table.status = 'available'
                        rt.table.save()
                        
            # 3. Create Audit Log
            AuditLog.objects.create(
                user=user,
                action=f"Processed refund for invoice ID: {invoice.id} (Amount: ${invoice.total})",
                model_name="Invoice",
                record_id=str(invoice.id),
                ip_address=ip_address
            )
            
            # 4. Dispatch WhatsApp cancel message
            if order and order.customer_phone:
                try:
                    from apps.notifications.services import CommunicationDispatchService
                    msg = f"Your billing transaction of ${invoice.total} for order at {invoice.branch.name} has been refunded successfully."
                    CommunicationDispatchService.send_whatsapp(order.customer_phone, msg, branch_id=invoice.branch.id)
                except Exception:
                    pass
                    
            return invoice
