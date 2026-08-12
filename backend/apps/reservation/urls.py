from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.reservation.views import TableViewSet, ReservationViewSet, WaitlistViewSet, AvailabilityView

router = DefaultRouter()
router.register('tables', TableViewSet, basename='table')
router.register('bookings', ReservationViewSet, basename='booking')
router.register('waitlist', WaitlistViewSet, basename='waitlist')

urlpatterns = [
    path('availability/', AvailabilityView.as_view(), name='availability'),
    path('', include(router.urls)),
]
