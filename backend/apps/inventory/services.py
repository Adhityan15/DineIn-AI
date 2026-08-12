from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.inventory.models import (
    Ingredient, MenuItem, Recipe, RecipeIngredient, Vendor,
    InventoryBatch, StockMovement, Purchase, PurchaseItem, Wastage, Consumption, ReorderAlert
)
from apps.core.models import Branch

class InventoryService:
    @staticmethod
    @transaction.atomic
    def add_stock(branch, ingredient, quantity, batch_number, purchase_price, expiry_date=None):
        """
        Create a new inventory stock batch and log a positive stock movement.
        """
        if quantity <= 0:
            raise ValidationError("Quantity to add must be greater than zero.")

        batch = InventoryBatch.objects.create(
            branch=branch,
            ingredient=ingredient,
            quantity=quantity,
            batch_number=batch_number,
            purchase_price=purchase_price,
            expiry_date=expiry_date,
            status='active'
        )

        StockMovement.objects.create(
            branch=branch,
            ingredient=ingredient,
            batch=batch,
            quantity=quantity,
            movement_type='purchase',
            description=f"Received batch {batch_number} via purchase."
        )
        return batch

    @staticmethod
    @transaction.atomic
    def deduct_stock(branch, ingredient, quantity, movement_type, description, user=None, recipe=None):
        """
        Deduct stock of an ingredient using FEFO (First Expired, First Out) rules.
        """
        if quantity <= 0:
            raise ValidationError("Quantity to deduct must be greater than zero.")

        # Check total available quantity first
        total_available = InventoryBatch.objects.filter(
            branch=branch,
            ingredient=ingredient,
            status='active'
        ).aggregate(models.Sum('quantity'))['quantity__sum'] or Decimal('0.00')

        if total_available < quantity:
            raise ValidationError(
                f"Insufficient stock for {ingredient.name}. Requested: {quantity} {ingredient.unit}, Available: {total_available} {ingredient.unit}"
            )

        # Query active batches sorted by expiry_date (nulls last if standard, but let's query non-null first, then null)
        # To simplify, we can sort by expiry_date (Django sorts nulls first or last depending on db, we can handle it)
        # Using expression to push null values to the end of sorting:
        batches = InventoryBatch.objects.filter(
            branch=branch,
            ingredient=ingredient,
            status='active',
            quantity__gt=0
        ).order_by(models.F('expiry_date').asc(nulls_last=True), 'created_at')

        remaining_to_deduct = quantity
        deducted_batches = []

        for batch in batches:
            if remaining_to_deduct <= 0:
                break

            deduction = min(batch.quantity, remaining_to_deduct)
            batch.quantity -= deduction
            remaining_to_deduct -= deduction

            if batch.quantity <= 0:
                batch.status = 'depleted'
            batch.save()

            StockMovement.objects.create(
                branch=branch,
                ingredient=ingredient,
                batch=batch,
                quantity=-deduction,
                movement_type=movement_type,
                description=description,
                user=user
            )
            deducted_batches.append((batch, deduction))

        # Log high level Consumption entry if it is manual or sales based
        if movement_type in ['consumption_manual', 'consumption_sales']:
            Consumption.objects.create(
                branch=branch,
                ingredient=ingredient,
                quantity=quantity,
                logged_by=user,
                source='pos_sales' if movement_type == 'consumption_sales' else 'manual',
                recipe=recipe
            )

        return deducted_batches

    @staticmethod
    @transaction.atomic
    def adjust_stock(branch, ingredient, physical_quantity, reason, user=None):
        """
        Adjust inventory discrepancies after physical count audit.
        """
        # Sum current active stock
        current_stock = InventoryBatch.objects.filter(
            branch=branch,
            ingredient=ingredient,
            status='active'
        ).aggregate(models.Sum('quantity'))['quantity__sum'] or Decimal('0.00')

        delta = physical_quantity - current_stock
        if delta == 0:
            return

        if delta > 0:
            # Positive adjustment: create a reconciliation batch
            batch_no = f"RECON-{timezone.now().strftime('%Y%m%d%H%M')}"
            # Find average purchase price of active batches to assign a reasonable price
            avg_price = InventoryBatch.objects.filter(
                branch=branch,
                ingredient=ingredient,
                status='active'
            ).aggregate(models.Avg('purchase_price'))['purchase_price__avg'] or Decimal('0.00')

            batch = InventoryBatch.objects.create(
                branch=branch,
                ingredient=ingredient,
                quantity=delta,
                batch_number=batch_no,
                purchase_price=avg_price,
                status='active'
            )

            StockMovement.objects.create(
                branch=branch,
                ingredient=ingredient,
                batch=batch,
                quantity=delta,
                movement_type='adjustment',
                description=f"Physical reconciliation increment: {reason}",
                user=user
            )
        else:
            # Negative adjustment: FEFO deduction
            InventoryService.deduct_stock(
                branch=branch,
                ingredient=ingredient,
                quantity=-delta,
                movement_type='adjustment',
                description=f"Physical reconciliation deduction: {reason}",
                user=user
            )

    @staticmethod
    @transaction.atomic
    def evaluate_reorder_alerts(branch):
        """
        Evaluate stock levels and generate three-level severity warnings.
        """
        ingredients = Ingredient.objects.all()
        alerts_created = []

        for ing in ingredients:
            total_stock = InventoryBatch.objects.filter(
                branch=branch,
                ingredient=ing,
                status='active'
            ).aggregate(models.Sum('quantity'))['quantity__sum'] or Decimal('0.00')

            if total_stock <= ing.min_stock:
                # Determine alert severity levels
                critical_threshold = ing.min_stock * Decimal('0.25') # 25% of min stock threshold
                
                if total_stock <= 0 or total_stock <= critical_threshold:
                    severity = 'critical_stock'
                    message = f"CRITICAL STOCK ALERT: {ing.name} is severely low or out of stock! Current: {total_stock} {ing.unit} (Threshold: {ing.min_stock} {ing.unit}). Immediate purchase order required."
                elif total_stock <= ing.min_stock * Decimal('0.60'):
                    severity = 'low_stock'
                    message = f"LOW STOCK WARNING: {ing.name} is running low. Current: {total_stock} {ing.unit} (Threshold: {ing.min_stock} {ing.unit})."
                else:
                    severity = 'warning'
                    message = f"Warning: {ing.name} stock level is nearing minimum threshold limits. Current: {total_stock} {ing.unit}."

                # Get or create active alert
                alert, created = ReorderAlert.objects.get_or_create(
                    branch=branch,
                    ingredient=ing,
                    status='active',
                    defaults={'alert_type': severity, 'message': message}
                )
                if not created and alert.alert_type != severity:
                    alert.alert_type = severity
                    alert.message = message
                    alert.save()

                # Dispatch immediate notification placeholders for Critical Stock alerts
                if severity == 'critical_stock':
                    from apps.core.models import Notification
                    Notification.objects.get_or_create(
                        title=f"Critical Stock: {ing.name}",
                        message=message,
                        notification_type='email',
                        status='pending'
                    )
                
                alerts_created.append(alert)
            else:
                # If stock rose back above threshold, resolve any active alerts
                ReorderAlert.objects.filter(
                    branch=branch,
                    ingredient=ing,
                    status='active'
                ).update(status='resolved', resolved_at=timezone.now())

        return alerts_created

    @staticmethod
    @transaction.atomic
    def deduct_ingredients_for_order(order, user=None):
        """
        Deduct ingredients for all items in an order using their recipes.
        """
        for item in order.items.all():
            recipe = Recipe.objects.filter(menu_item=item.menu_item).first()
            if recipe:
                RecipeService.deduct_recipe_consumption(
                    branch=order.branch,
                    recipe=recipe,
                    multiplier=item.quantity,
                    user=user
                )
        # Automatically evaluate low stock alerts after sales deduction
        InventoryService.evaluate_reorder_alerts(order.branch)

    @staticmethod
    @transaction.atomic
    def restore_ingredients_for_order(order, user=None):
        """
        Restore ingredients for all items in an order when a refund is processed.
        """
        for item in order.items.all():
            recipe = Recipe.objects.filter(menu_item=item.menu_item).first()
            if recipe:
                for ri in recipe.ingredients.all():
                    qty_to_restore = ri.quantity * Decimal(str(item.quantity))
                    
                    # Find the last batch of this ingredient in the branch to add it back
                    batch = InventoryBatch.objects.filter(
                        branch=order.branch,
                        ingredient=ri.ingredient
                    ).order_by('-created_at').first()
                    
                    if batch:
                        batch.quantity += qty_to_restore
                        if batch.status == 'depleted':
                            batch.status = 'active'
                        batch.save()
                    else:
                        # Fallback: create a new batch for refund adjustment
                        batch_no = f"REFUND-{timezone.now().strftime('%Y%m%d%H%M')}"
                        batch = InventoryBatch.objects.create(
                            branch=order.branch,
                            ingredient=ri.ingredient,
                            quantity=qty_to_restore,
                            batch_number=batch_no,
                            purchase_price=Decimal('0.00'),
                            status='active'
                        )
                        
                    # Log stock movement
                    StockMovement.objects.create(
                        branch=order.branch,
                        ingredient=ri.ingredient,
                        batch=batch,
                        quantity=qty_to_restore,
                        movement_type='adjustment',
                        description=f"Stock restored due to POS refund of order: {order.id}.",
                        user=user
                    )
                    
                    # Log negative consumption to balance analytics
                    Consumption.objects.create(
                        branch=order.branch,
                        ingredient=ri.ingredient,
                        quantity=-qty_to_restore,
                        logged_by=user,
                        source='pos_sales',
                        recipe=recipe
                    )
        # Automatically evaluate low stock alerts after sales restoration
        InventoryService.evaluate_reorder_alerts(order.branch)



class PurchaseService:
    @staticmethod
    @transaction.atomic
    def receive_purchase(branch, vendor, invoice_no, purchase_date, items_data):
        """
        Record a purchase delivery, compute total pricing, perform unit conversions,
        and inject batch stock items dynamically.
        """
        purchase = Purchase.objects.create(
            branch=branch,
            vendor=vendor,
            invoice_no=invoice_no,
            purchase_date=purchase_date,
            status='delivered'
        )

        total_amount = Decimal('0.00')

        for item in items_data:
            ingredient = item['ingredient']
            qty_purchase = Decimal(str(item['quantity']))
            unit_price = Decimal(str(item['unit_price']))
            factor = Decimal(str(item.get('conversion_factor', '1.00')))
            batch_no = item['batch_number']
            expiry = item.get('expiry_date')

            # Calculate base units and base price
            qty_base = qty_purchase * factor
            price_base = unit_price / factor

            PurchaseItem.objects.create(
                purchase=purchase,
                ingredient=ingredient,
                quantity=qty_purchase,
                purchase_unit=item.get('purchase_unit', ingredient.unit),
                conversion_factor=factor,
                unit_price=unit_price,
                batch_number=batch_no,
                expiry_date=expiry
            )

            # Auto create InventoryBatch using InventoryService
            InventoryService.add_stock(
                branch=branch,
                ingredient=ingredient,
                quantity=qty_base,
                batch_number=batch_no,
                purchase_price=price_base,
                expiry_date=expiry
            )

            total_amount += (qty_purchase * unit_price)

        purchase.total_amount = total_amount
        purchase.save()
        return purchase


class WastageService:
    @staticmethod
    @transaction.atomic
    def record_wastage(branch, batch, ingredient, quantity, reason, description, user):
        """
        Log ingredient wastage, calculate direct cost impact, and deduct stock.
        """
        if quantity <= 0:
            raise ValidationError("Wasted quantity must be greater than zero.")

        cost_price = Decimal('0.00')

        if batch:
            if batch.quantity < quantity:
                raise ValidationError(f"Cannot record wastage larger than batch quantity. Available: {batch.quantity}")
            batch.quantity -= quantity
            if batch.quantity <= 0:
                batch.status = 'depleted'
            batch.save()

            cost_price = batch.purchase_price
            StockMovement.objects.create(
                branch=branch,
                ingredient=ingredient,
                batch=batch,
                quantity=-quantity,
                movement_type='wastage',
                description=f"Wastage recorded: {reason}. {description}",
                user=user
            )
        else:
            # FEFO deduction across active batches
            deductions = InventoryService.deduct_stock(
                branch=branch,
                ingredient=ingredient,
                quantity=quantity,
                movement_type='wastage',
                description=f"Wastage recorded: {reason}. {description}",
                user=user
            )
            # Weighted average price of deducted batches to calculate cost impact
            total_cost = sum(b.purchase_price * qty for b, qty in deductions)
            cost_price = total_cost / quantity if quantity > 0 else Decimal('0.00')

        cost_impact = quantity * cost_price

        wastage_log = Wastage.objects.create(
            branch=branch,
            batch=batch,
            ingredient=ingredient,
            quantity=quantity,
            reason=reason,
            description=description,
            cost_impact=cost_impact,
            recorded_by=user
        )
        return wastage_log


class RecipeService:
    @staticmethod
    @transaction.atomic
    def deduct_recipe_consumption(branch, recipe, multiplier=1, user=None):
        """
        Auto-deduct ingredient levels when a menu item is sold, using recipe mapping.
        """
        deduction_logs = []
        for ri in recipe.ingredients.all():
            req_qty = ri.quantity * Decimal(str(multiplier))
            # Deduct ingredient stock using FEFO rules
            deduct_details = InventoryService.deduct_stock(
                branch=branch,
                ingredient=ri.ingredient,
                quantity=req_qty,
                movement_type='consumption_sales',
                description=f"Automated POS sales consumption for menu recipe: {recipe.menu_item.name}.",
                user=user,
                recipe=recipe
            )
            deduction_logs.append((ri.ingredient, deduct_details))
        return deduction_logs
