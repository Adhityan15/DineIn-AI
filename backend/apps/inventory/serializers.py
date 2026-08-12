from rest_framework import serializers
from apps.inventory.models import (
    Ingredient, MenuItem, Recipe, RecipeIngredient, Vendor,
    InventoryBatch, StockMovement, Purchase, PurchaseItem, Wastage, Consumption, ReorderAlert, Order, OrderItem,
    DailyStockRecord
)

class IngredientSerializer(serializers.ModelSerializer):
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'category', 'unit', 'min_stock', 'max_stock', 'abc_class', 'total_stock', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_stock(self, obj):
        # Dynamically calculate total active stock
        from django.db.models import Sum
        return obj.batches.filter(status='active').aggregate(Sum('quantity'))['quantity__sum'] or 0.00


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'price', 'is_active', 'description', 'category', 'image_url',
            'prep_time', 'calories', 'veg_nonveg', 'is_bestseller', 'is_chef_special',
            'is_featured', 'spice_level', 'discount', 'gst', 'sku', 'barcode',
            'kitchen_station', 'is_available', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'recipe', 'ingredient', 'ingredient_name', 'ingredient_unit', 'quantity']
        read_only_fields = ['id']


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    menu_item_name = serializers.ReadOnlyField(source='menu_item.name')

    class Meta:
        model = Recipe
        fields = ['id', 'menu_item', 'menu_item_name', 'name', 'description', 'ingredients', 'created_at']
        read_only_fields = ['id', 'created_at']


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['id', 'name', 'contact_name', 'phone', 'email', 'address', 'performance_score', 'created_at']
        read_only_fields = ['id', 'created_at']


class InventoryBatchSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')

    class Meta:
        model = InventoryBatch
        fields = [
            'id', 'branch', 'ingredient', 'ingredient_name', 'ingredient_unit',
            'quantity', 'batch_number', 'purchase_price', 'expiry_date', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StockMovementSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')
    recorded_by = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = StockMovement
        fields = [
            'id', 'branch', 'ingredient', 'ingredient_name', 'ingredient_unit', 'batch',
            'quantity', 'movement_type', 'description', 'recorded_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PurchaseItemSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')

    class Meta:
        model = PurchaseItem
        fields = [
            'id', 'purchase', 'ingredient', 'ingredient_name', 'quantity',
            'purchase_unit', 'conversion_factor', 'unit_price', 'batch_number', 'expiry_date'
        ]
        read_only_fields = ['id']


class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, read_only=True)
    vendor_name = serializers.ReadOnlyField(source='vendor.name')

    class Meta:
        model = Purchase
        fields = ['id', 'branch', 'vendor', 'vendor_name', 'invoice_no', 'purchase_date', 'total_amount', 'status', 'items', 'created_at']
        read_only_fields = ['id', 'total_amount', 'created_at']


class WastageSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')
    recorded_by_email = serializers.ReadOnlyField(source='recorded_by.email')

    class Meta:
        model = Wastage
        fields = [
            'id', 'branch', 'batch', 'ingredient', 'ingredient_name', 'ingredient_unit',
            'quantity', 'reason', 'description', 'cost_impact', 'recorded_by_email', 'recorded_at'
        ]
        read_only_fields = ['id', 'cost_impact', 'recorded_at']


class ConsumptionSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')
    logged_by_email = serializers.ReadOnlyField(source='logged_by.email')

    class Meta:
        model = Consumption
        fields = [
            'id', 'branch', 'ingredient', 'ingredient_name', 'ingredient_unit',
            'quantity', 'logged_by_email', 'logged_at', 'source', 'recipe'
        ]
        read_only_fields = ['id', 'logged_at']


class ReorderAlertSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')

    class Meta:
        model = ReorderAlert
        fields = ['id', 'branch', 'ingredient', 'ingredient_name', 'ingredient_unit', 'alert_type', 'status', 'message', 'resolved_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.ReadOnlyField(source='menu_item.name')

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'unit_price', 'kitchen_notes', 'waiter_notes', 'special_instructions', 'item_discount', 'course', 'modifiers']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    branch_name = serializers.ReadOnlyField(source='branch.name')
    table_number = serializers.ReadOnlyField(source='table.number')
    estimated_prep_time = serializers.SerializerMethodField(read_only=True)

    waiter_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('waiter_name') and instance.waiter:
            ret['waiter_name'] = instance.waiter.name
        return ret

    class Meta:
        model = Order
        fields = [
            'id', 'branch', 'branch_name', 'source', 'status', 'order_type',
            'reservation', 'table', 'table_number', 'customer_name',
            'customer_phone', 'delivery_address', 'total_amount', 'items',
            'estimated_prep_time', 'waiter', 'waiter_name', 'created_at', 'updated_at'
        ]

    def get_estimated_prep_time(self, obj):
        items = obj.items.all()
        if not items:
            return 15
        return max((item.menu_item.prep_time for item in items), default=15)

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        total = 0
        from decimal import Decimal
        for item_data in items_data:
            qty = item_data.get('quantity', 1)
            price = item_data.get('unit_price')
            item_disc = item_data.get('item_discount', Decimal('0.00'))
            total += max(Decimal('0.00'), (qty * price) - item_disc)
            OrderItem.objects.create(order=order, **item_data)
        order.total_amount = total
        order.save()
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update Order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update OrderItems if provided
        if items_data is not None:
            instance.items.all().delete()
            total = 0
            from decimal import Decimal
            for item_data in items_data:
                qty = item_data.get('quantity', 1)
                price = item_data.get('unit_price')
                item_disc = item_data.get('item_discount', Decimal('0.00'))
                total += max(Decimal('0.00'), (qty * price) - item_disc)
                OrderItem.objects.create(order=instance, **item_data)
            instance.total_amount = total
            instance.save()
            
        return instance


class DailyStockRecordSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')
    manager_name = serializers.ReadOnlyField(source='manager.username')

    class Meta:
        model = DailyStockRecord
        fields = [
            'id', 'branch', 'ingredient', 'ingredient_name', 'ingredient_unit',
            'opening_stock', 'purchased_stock', 'closing_stock', 'consumption',
            'opening_date', 'closing_date', 'manager', 'manager_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

