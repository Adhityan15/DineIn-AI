import logging
from django.utils.dateparse import parse_datetime
from datetime import timedelta
from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

from apps.reservation.models import Table, Reservation, Waitlist
from apps.reservation.serializers import TableSerializer, ReservationSerializer, WaitlistSerializer, ReservationHistorySerializer
from apps.reservation.services import ReservationService, AvailabilityService, WaitlistService, TableAllocationService

logger = logging.getLogger('dinein.reservation')

def is_valid_uuid(val):
    if not val:
        return False
    import uuid
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, TypeError):
        return False

class IsStaffOrAbove(BasePermission):
    """
    Custom permission to exclude customers from administrative booking operations.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        from apps.core.permissions import get_user_role_code
        role_code = get_user_role_code(request.user)
        return role_code in ['admin', 'owner', 'manager', 'receptionist', 'service_staff']

class TableViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Table layouts configurations CRUD actions.
    """
    queryset = Table.objects.all().order_by('number')
    serializer_class = TableSerializer
    def get_permissions(self):
        from apps.core.permissions import IsAdminOrOwner, IsManagerOrAbove
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrOwner()]
        if self.action in ['transfer_table', 'merge_tables']:
            return [IsManagerOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        active_branch = self.request.active_branch
        branch_id = self.request.query_params.get('branch')
        
        if not active_branch and branch_id:
            try:
                from apps.core.models import Branch
                active_branch = Branch.objects.get(id=branch_id)
            except Exception:
                pass

        if active_branch:
            branch_qs = qs.filter(branch=active_branch)
            if not branch_qs.exists():
                # Automatically create 25 restaurant tables for this branch!
                try:
                    for i in range(1, 26):
                        Table.objects.create(
                            branch=active_branch,
                            number=str(i),
                            capacity=4 if i % 2 == 0 else 2,
                            status='available'
                        )
                    # Refresh the query
                    branch_qs = Table.objects.filter(branch=active_branch)
                except Exception as e:
                    print("Auto-generating tables failed:", e)
            return branch_qs.order_by('number')
        return qs

    @action(detail=True, methods=['get'], url_path='active-booking', url_name='active-booking')
    def active_booking(self, request, pk=None):
        """
        Retrieves active booking details, loyalty records, and customer previous orders metadata for selected table.
        """
        table = self.get_object()
        from apps.reservation.models import ReservationTable
        from apps.authentication.models import User, LoyaltyProfile
        from apps.inventory.models import Order
        from django.db.models import Q
        
        # Get active dining reservation
        res_table = ReservationTable.objects.filter(
            table=table,
            reservation__status__in=['checked_in', 'arrived', 'seated', 'dining']
        ).select_related('reservation', 'reservation__customer', 'reservation__waiter').first()
        
        if not res_table:
            return Response({"active": False, "message": "No active dining sessions found on this table."})
            
        res = res_table.reservation
        phone = res.guest_phone
        email = res.guest_email
        
        # Resolve loyalty profile
        user = User.objects.filter(Q(phone=phone) | Q(email=email)).first() if (phone or email) else None
        loyalty_tier = "silver"
        loyalty_points = 0
        if user:
            loy = LoyaltyProfile.objects.filter(user=user).first()
            if loy:
                loyalty_tier = loy.tier
                loyalty_points = loy.points
                
        # Resolve previous completed orders count
        prev_orders_count = Order.objects.filter(
            Q(customer_phone=phone) | Q(customer_phone=email) | Q(customer_name=res.guest_name)
        ).filter(status='completed').count()
        
        return Response({
            "active": True,
            "reservation_id": str(res.id),
            "guest_name": res.guest_name,
            "guest_phone": res.guest_phone,
            "guest_email": res.guest_email,
            "party_size": res.party_size,
            "waiter": res.waiter.id if res.waiter else None,
            "waiter_name": res.waiter.name if res.waiter else "N/A",
            "start_time": res.start_time.isoformat(),
            "end_time": res.end_time.isoformat(),
            "notes": res.notes,
            "allergy_notes": res.allergy_notes,
            "special_requests": res.special_requests,
            "is_vip": res.is_vip,
            "loyalty_tier": loyalty_tier,
            "loyalty_points": loyalty_points,
            "previous_orders_count": prev_orders_count
        })

    @action(detail=True, methods=['post'], url_path='transfer', url_name='transfer')
    def transfer_table(self, request, pk=None):
        """
        Transfers active reservation and orders from this table to another.
        """
        from apps.inventory.pos_services import TableService
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        from_table = self.get_object()
        to_table_number = request.data.get('to_table')
        if not to_table_number:
            return Response({"error": "Destination table number is required."}, status=400)
            
        try:
            to_table = Table.objects.get(branch=from_table.branch, number=to_table_number)
            TableService.transfer_table(from_table, to_table, request.user, request)
            return Response({"success": True, "message": f"Table transferred to {to_table_number} successfully."})
        except Table.DoesNotExist:
            return Response({"error": f"Destination table {to_table_number} does not exist in this branch."}, status=400)
        except DjangoValidationError as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=True, methods=['post'], url_path='merge', url_name='merge')
    def merge_tables(self, request, pk=None):
        """
        Merges other tables into this active dining session.
        """
        from apps.inventory.pos_services import TableService
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        target_table = self.get_object()
        source_tables_numbers = request.data.get('tables', [])
        
        try:
            source_tables = Table.objects.filter(branch=target_table.branch, number__in=source_tables_numbers)
            TableService.merge_tables(target_table, list(source_tables), request.user, request)
            return Response({"success": True, "message": f"Tables merged successfully under {target_table.number}."})
        except DjangoValidationError as e:
            return Response({"error": str(e)}, status=400)


class ReservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Reservation bookings creation, queries, checks, and updates.
    """
    queryset = Reservation.objects.all().order_by('-start_time')
    serializer_class = ReservationSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action in ['list', 'retrieve', 'cancel', 'quick_walk_in']:
            return [IsAuthenticated()]
        return [IsStaffOrAbove()]

    @action(detail=False, methods=['post'], url_path='quick-walk-in')
    def quick_walk_in(self, request):
        branch_id = request.data.get('branch') or (request.active_branch.id if request.active_branch else None)
        table_id = request.data.get('table')
        party_size = int(request.data.get('party_size', 1))
        guest_name = request.data.get('guest_name')
        guest_phone = request.data.get('guest_phone')

        if not branch_id or not table_id:
            raise DRFValidationError("Branch ID and Table ID are required.")

        try:
            from apps.reservation.models import Table
            if is_valid_uuid(table_id):
                table = Table.objects.get(id=table_id, branch_id=branch_id)
            else:
                table = Table.objects.get(number=table_id, branch_id=branch_id)
                
            reservation = ReservationService.quick_walk_in_seat(
                branch_id=branch_id,
                table_id=table.id,
                party_size=party_size,
                guest_name=guest_name,
                guest_phone=guest_phone,
                user=request.user if request.user.is_authenticated else None
            )
            serializer = self.get_serializer(reservation)
            return Response({
                "success": True,
                "message": "Quick walk-in seated and dining session started successfully.",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        except Table.DoesNotExist:
            return Response({
                "success": False,
                "message": f"Table {table_id} does not exist in this branch."
            }, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        """
        Supports searching/filtering parameters:
        - guest_name, guest_phone, guest_email, status, start_date, table_number
        """
        qs = super().get_queryset()
        
        # Customer Role Isolation
        if self.request.user.is_authenticated and hasattr(self.request.user, 'role') and self.request.user.role and self.request.user.role.code == 'customer':
            qs = qs.filter(customer=self.request.user)

        # Searching Filters
        guest_name = self.request.query_params.get('guest_name')
        guest_phone = self.request.query_params.get('guest_phone')
        guest_email = self.request.query_params.get('guest_email')
        status_param = self.request.query_params.get('status')
        start_date = self.request.query_params.get('start_date')
        table_number = self.request.query_params.get('table_number')
        reservation_id = self.request.query_params.get('reservation_id')

        if reservation_id:
            qs = qs.filter(id=reservation_id)
        active_branch = self.request.active_branch
        if active_branch:
            qs = qs.filter(branch=active_branch)

        if guest_name:
            qs = qs.filter(guest_name__icontains=guest_name)
        if guest_phone:
            qs = qs.filter(guest_phone__icontains=guest_phone)
        if guest_email:
            qs = qs.filter(guest_email__icontains=guest_email)
        if status_param:
            qs = qs.filter(status=status_param)
        if start_date:
            qs = qs.filter(start_time__date=start_date)
        if table_number:
            qs = qs.filter(reservation_tables__table__number=table_number)

        return qs.distinct()

    def create(self, request, *args, **kwargs):
        """
        Handles bookings creations utilizing business service overlap checks.
        """
        branch_id = request.data.get('branch')
        guest_name = request.data.get('guest_name')
        guest_phone = request.data.get('guest_phone')
        guest_email = request.data.get('guest_email')
        party_size = int(request.data.get('party_size', 1))
        start_time_str = request.data.get('start_time')
        notes = request.data.get('notes', '')
        is_walk_in = request.data.get('is_walk_in', False)

        if not branch_id or not start_time_str:
            raise DRFValidationError("Branch ID and Start Time are required.")

        start_time = parse_datetime(start_time_str)
        if not start_time:
            raise DRFValidationError("Invalid start time ISO format.")

        # Gather optional params
        attributes = {}
        for attr in ['is_birthday', 'is_anniversary', 'is_vip', 'needs_wheelchair', 'needs_baby_chair', 'allergy_notes', 'special_requests']:
            if attr in request.data:
                attributes[attr] = request.data[attr]

        try:
            reservation = ReservationService.create_reservation(
                branch_id=branch_id,
                guest_name=guest_name,
                guest_phone=guest_phone,
                guest_email=guest_email,
                party_size=party_size,
                start_time=start_time,
                notes=notes,
                customer=request.user if request.user.is_authenticated else None,
                is_walk_in=is_walk_in,
                **attributes
            )
            serializer = self.get_serializer(reservation)
            return Response({
                "success": True,
                "message": "Reservation created and confirmed successfully.",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        except (DjangoValidationError, DRFValidationError) as e:
            msg = e.message_dict if hasattr(e, 'message_dict') else str(e)
            return Response({
                "success": False,
                "message": "Failed to create reservation.",
                "data": msg
            }, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """
        Handle updates utilizing state updates service wrappers.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        updates = request.data.copy()
        if 'start_time' in updates:
            start_time = parse_datetime(updates['start_time'])
            if not start_time:
                raise DRFValidationError("Invalid start time format.")
            updates['start_time'] = start_time

        try:
            updated_res = ReservationService.modify_reservation(instance.id, **updates)
            serializer = self.get_serializer(updated_res)
            return Response({
                "success": True,
                "message": "Reservation updated successfully.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e),
                "data": None
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        try:
            res = ReservationService.approve_reservation(pk, user=request.user, reason=request.data.get('reason'))
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Reservation approved and confirmed successfully.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        try:
            res = ReservationService.reject_reservation(pk, user=request.user, reason=request.data.get('reason'))
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Reservation rejected and tables released.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in(self, request, pk=None):
        """
        Check in guest at host station (Checked In status).
        """
        try:
            res = ReservationService.check_in_guest(pk, user=request.user)
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Guest checked in successfully.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='seat')
    def seat(self, request, pk=None):
        """
        Seat guest at assigned tables (Seated/Dining status, table occupied).
        """
        try:
            res = ReservationService.seat_guest(pk, user=request.user)
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Guest seated. Table status updated to occupied.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='start-dining')
    def start_dining(self, request, pk=None):
        """
        Transition reservation to dining.
        """
        try:
            res = ReservationService.start_dining(pk, user=request.user)
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Dining session started successfully.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='request-checkout')
    def request_checkout(self, request, pk=None):
        """
        Request checkout.
        """
        try:
            res = ReservationService.request_checkout(pk, user=request.user)
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Checkout requested successfully.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='check-out')
    def check_out(self, request, pk=None):
        """
        Check out / Complete dining session.
        """
        try:
            res = ReservationService.check_out_guest(pk, user=request.user)
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Guest checked out and tables released successfully.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Cancel booking.
        """
        reason = request.data.get('reason')
        if not reason or not reason.strip():
            return Response({
                "success": False,
                "message": "Cancellation reason is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Customer Role Isolation Check
        res_obj = self.get_object()
        from apps.core.permissions import get_user_role_code
        role_code = get_user_role_code(request.user)
        if role_code == 'customer' and res_obj.customer != request.user:
            return Response({
                "success": False,
                "message": "You do not have permission to cancel this reservation."
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            res = ReservationService.cancel_reservation(pk, user=request.user, reason=reason)
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Reservation cancelled successfully.",
                "data": serializer.data
            })
        except Exception as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='no-show')
    def no_show(self, request, pk=None):
        """
        Mark guest as No Show.
        """
        try:
            res = ReservationService.no_show_guest(pk, user=request.user, reason=request.data.get('reason'))
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "Reservation marked as No Show.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='qr-check-in')
    def qr_check_in(self, request):
        """
        Perform automated check-in and seating from a QR scan of the Reservation ID.
        """
        reservation_id = request.data.get('reservation_id')
        if not reservation_id:
            return Response({
                "success": False,
                "message": "Reservation ID is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Stage 1: Check in guest
            res = ReservationService.check_in_guest(reservation_id, user=request.user)
            # Stage 2: Seat guest
            res = ReservationService.seat_guest(reservation_id, user=request.user)
            serializer = self.get_serializer(res)
            return Response({
                "success": True,
                "message": "QR Scan Successful! Guest checked in and seated at tables.",
                "data": serializer.data
            })
        except Exception as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        """
        Returns transition logs history for a booking.
        """
        instance = self.get_object()
        history_qs = instance.history.all().order_by('timestamp')
        serializer = ReservationHistorySerializer(history_qs, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        })


class WaitlistViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling virtual queue entries check-ins and notify allocations.
    """
    queryset = Waitlist.objects.all().order_by('joined_at')
    serializer_class = WaitlistSerializer

    def get_permissions(self):
        if self.action in ['join', 'create', 'cancel', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsStaffOrAbove()]

    def get_queryset(self):
        status_param = self.request.query_params.get('status')
        qs = super().get_queryset()
        
        active_branch = self.request.active_branch
        if active_branch:
            qs = qs.filter(branch=active_branch)
        if status_param:
            qs = qs.filter(status=status_param)
            
        return qs

    @action(detail=False, methods=['post'], url_path='join')
    def join(self, request):
        branch_id = request.data.get('branch')
        guest_name = request.data.get('guest_name')
        guest_phone = request.data.get('guest_phone')
        guest_email = request.data.get('guest_email')
        party_size = int(request.data.get('party_size', 1))

        if not branch_id or not guest_name or not guest_phone:
            raise DRFValidationError("Branch, Name, and Phone are required parameters.")

        try:
            entry = WaitlistService.join_waitlist(
                branch_id=branch_id,
                guest_name=guest_name,
                guest_phone=guest_phone,
                guest_email=guest_email,
                party_size=party_size
            )
            serializer = self.get_serializer(entry)
            return Response({
                "success": True,
                "message": "Waitlist entry joined successfully.",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='notify')
    def notify(self, request, pk=None):
        try:
            entry = WaitlistService.notify_guest(pk)
            serializer = self.get_serializer(entry)
            return Response({
                "success": True,
                "message": "Waitlist guest notified successfully.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='promote')
    def promote(self, request, pk=None):
        table_ids = request.data.get('tables', [])
        if not table_ids:
            raise DRFValidationError("Table IDs must be provided to promote customer.")

        try:
            reservation = WaitlistService.promote_and_check_in(pk, table_ids)
            return Response({
                "success": True,
                "message": "Waitlist entry promoted to active reservation successfully.",
                "data": ReservationSerializer(reservation).data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        entry = WaitlistService.cancel_waitlist(pk)
        serializer = self.get_serializer(entry)
        return Response({
            "success": True,
            "message": "Waitlist entry cancelled.",
            "data": serializer.data
        })

    @action(detail=True, methods=['post'], url_path='expire')
    def expire(self, request, pk=None):
        try:
            entry = WaitlistService.expire_waitlist_entry(pk)
            serializer = self.get_serializer(entry)
            return Response({
                "success": True,
                "message": "Waitlist entry expired.",
                "data": serializer.data
            })
        except DjangoValidationError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AvailabilityView(views.APIView):
    """
    API endpoint returning table availability status or alternative suggestions.
    """
    def get(self, request):
        branch_id = request.query_params.get('branch')
        start_time_str = request.query_params.get('start_time')
        party_size_str = request.query_params.get('party_size', '1')

        if not branch_id or not is_valid_uuid(branch_id) or not start_time_str:
            return Response({
                "success": False,
                "message": "Branch and Start Time query parameters are required, and branch must be a valid UUID."
            }, status=status.HTTP_400_BAD_REQUEST)

        start_time = parse_datetime(start_time_str)
        if not start_time:
            return Response({
                "success": False,
                "message": "Invalid start time format."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            party_size = int(party_size_str)
        except ValueError:
            return Response({
                "success": False,
                "message": "Invalid party size integer."
            }, status=status.HTTP_400_BAD_REQUEST)

        end_time = start_time + timedelta(hours=AvailabilityService.DEFAULT_DURATION_HOURS)

        # 1. Validate Business hours
        if not AvailabilityService.is_within_business_hours(start_time):
            return Response({
                "success": False,
                "message": "Requested time falls outside branch business operational hours (11:00 AM - 11:00 PM).",
                "data": None
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Query available free tables
        free_tables = AvailabilityService.find_available_tables(branch_id, start_time, end_time, party_size)
        allocated = TableAllocationService.allocate_tables(free_tables, party_size)

        if allocated:
            return Response({
                "success": True,
                "message": "Tables are available for booking.",
                "data": {
                    "is_available": True,
                    "tables": TableSerializer(allocated, many=True).data,
                    "suggested_slots": []
                }
            })
        
        # 3. Fetch recommendations if primary search fails
        alternatives = AvailabilityService.suggest_alternative_slots(branch_id, start_time, party_size)
        return Response({
            "success": True,
            "message": "No tables available. Nearby alternative slot recommendations returned.",
            "data": {
                "is_available": False,
                "tables": [],
                "suggested_slots": alternatives
            }
        })
