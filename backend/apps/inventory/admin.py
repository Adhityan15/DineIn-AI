from django.contrib import admin
from apps.inventory.models import (
    Ingredient, MenuItem, Recipe, RecipeIngredient, Vendor,
    InventoryBatch, StockMovement, Purchase, PurchaseItem, Wastage, Consumption, ReorderAlert
)

class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'unit', 'min_stock', 'max_stock', 'abc_class')
    list_filter = ('category', 'abc_class')
    search_fields = ('name',)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('menu_item', 'name')
    search_fields = ('menu_item__name', 'name')
    inlines = [RecipeIngredientInline]


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_name', 'phone', 'email', 'performance_score')
    search_fields = ('name', 'contact_name')


@admin.register(InventoryBatch)
class InventoryBatchAdmin(admin.ModelAdmin):
    list_display = ('ingredient', 'batch_number', 'quantity', 'purchase_price', 'expiry_date', 'status')
    list_filter = ('status', 'expiry_date')
    search_fields = ('ingredient__name', 'batch_number')


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('ingredient', 'quantity', 'movement_type', 'user', 'created_at')
    list_filter = ('movement_type', 'created_at')
    search_fields = ('ingredient__name', 'description')


class PurchaseItemInline(admin.TabularInline):
    model = PurchaseItem
    extra = 1


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('invoice_no', 'vendor', 'purchase_date', 'total_amount', 'status')
    list_filter = ('status', 'purchase_date')
    search_fields = ('invoice_no', 'vendor__name')
    inlines = [PurchaseItemInline]


@admin.register(Wastage)
class WastageAdmin(admin.ModelAdmin):
    list_display = ('ingredient', 'quantity', 'reason', 'cost_impact', 'recorded_by', 'recorded_at')
    list_filter = ('reason', 'recorded_at')
    search_fields = ('ingredient__name', 'description')


@admin.register(Consumption)
class ConsumptionAdmin(admin.ModelAdmin):
    list_display = ('ingredient', 'quantity', 'source', 'logged_at')
    list_filter = ('source', 'logged_at')
    search_fields = ('ingredient__name',)


@admin.register(ReorderAlert)
class ReorderAlertAdmin(admin.ModelAdmin):
    list_display = ('ingredient', 'alert_type', 'status', 'created_at')
    list_filter = ('alert_type', 'status', 'created_at')
    search_fields = ('ingredient__name', 'message')
