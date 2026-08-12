from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.inventory.views import (
    IngredientViewSet, MenuItemViewSet, RecipeViewSet, RecipeIngredientViewSet,
    VendorViewSet, InventoryBatchViewSet, StockMovementViewSet,
    PurchaseViewSet, WastageViewSet, ConsumptionViewSet, ReorderAlertViewSet,
    InventoryAnalyticsView, OrderViewSet, OrderItemViewSet, CashDrawerSessionViewSet,
    DailyStockRecordViewSet
)

router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'menu-items', MenuItemViewSet, basename='menuitem')
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'recipe-ingredients', RecipeIngredientViewSet, basename='recipeingredient')
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'batches', InventoryBatchViewSet, basename='batch')
router.register(r'movements', StockMovementViewSet, basename='movement')
router.register(r'purchases', PurchaseViewSet, basename='purchase')
router.register(r'wastage', WastageViewSet, basename='wastage')
router.register(r'consumption', ConsumptionViewSet, basename='consumption')
router.register(r'alerts', ReorderAlertViewSet, basename='alert')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='orderitem')
router.register(r'drawers', CashDrawerSessionViewSet, basename='drawer')
router.register(r'daily-stock', DailyStockRecordViewSet, basename='dailystock')

urlpatterns = [
    path('analytics/', InventoryAnalyticsView.as_view(), name='analytics'),
    path('', include(router.urls)),
]
