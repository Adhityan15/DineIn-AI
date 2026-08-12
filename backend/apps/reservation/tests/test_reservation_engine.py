import pytest
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.utils import IntegrityError
from apps.core.models import Branch, Restaurant
from apps.reservation.models import Table, Reservation, ReservationTable, Waitlist
from apps.reservation.services import (
    AvailabilityService, 
    TableAllocationService, 
    ReservationService, 
    WaitlistService
)
from apps.reservation.tasks import check_no_show_bookings, auto_expire_waitlist_notifications

@pytest.mark.django_db
class TestReservationEngine:

    @pytest.fixture
    def setup_data(self):
        restaurant = Restaurant.objects.create(
            name="Test Eats",
            code="test-eats",
            contact_email="test@eats.com",
            contact_phone="+15005550006",
            address="Test Address"
        )
        branch = Branch.objects.create(
            restaurant=restaurant,
            name="Downtown",
            branch_code="downtown",
            address="Main St"
        )
        
        # Create Tables with different capacities & coordinate markers
        t1 = Table.objects.create(branch=branch, number="Table 1", capacity=2, x_coord=0, y_coord=0)
        t2 = Table.objects.create(branch=branch, number="Table 2", capacity=4, x_coord=10, y_coord=10)
        t3 = Table.objects.create(branch=branch, number="Table 3", capacity=6, x_coord=100, y_coord=100)
        t4 = Table.objects.create(branch=branch, number="Table 4", capacity=2, x_coord=20, y_coord=20) # Near Table 1 for combination checks
        
        return {
            "branch": branch,
            "tables": [t1, t2, t3, t4]
        }

    def test_greedy_table_allocation(self, setup_data):
        tables = setup_data["tables"]
        
        # 1. Party of 2 should get Table 1 or 4 (optimal 2-seat matching)
        allocated = TableAllocationService.allocate_tables(tables, party_size=2)
        assert len(allocated) == 1
        assert allocated[0].capacity == 2

        # 2. Party of 4 should get Table 2 (optimal 4-seat matching)
        allocated = TableAllocationService.allocate_tables(tables, party_size=4)
        assert len(allocated) == 1
        assert allocated[0].number == "Table 2"

        # 3. Party of 8 should combine Table 2 (capacity 4) and Table 3 (capacity 6)
        # Wait, distance between Table 2 (10, 10) and Table 3 (100, 100) is sqrt(90^2 + 90^2) = 127 units. 
        # Since 127 <= 150 connection limit, they can be combined!
        allocated = TableAllocationService.allocate_tables(tables, party_size=8)
        assert len(allocated) == 2
        numbers = [t.number for t in allocated]
        assert "Table 1" in numbers
        assert "Table 3" in numbers

    def test_table_availability_overlaps(self, setup_data):
        branch = setup_data["branch"]
        start_time = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0) # 6:00 PM (Within business hours)
        end_time = start_time + timedelta(hours=2)

        # 1. Verify tables are initially available
        free_tables = AvailabilityService.find_available_tables(branch.id, start_time, end_time, party_size=2)
        assert len(free_tables) == 4

        # 2. Book Table 1 (start 6:00 PM, end 8:00 PM)
        res = ReservationService.create_reservation(
            branch_id=branch.id,
            guest_name="Overlap Guest",
            guest_phone="+918888888888",
            party_size=2,
            start_time=start_time,
            status='confirmed'
        )
        assert res.status == 'confirmed'
        assert res.reservation_tables.count() == 1
        booked_table = res.reservation_tables.first().table
        assert booked_table.number in ["Table 1", "Table 4"]

        # 3. Verify that the booked table is excluded during overlapping queries
        free_tables_overlap = AvailabilityService.find_available_tables(branch.id, start_time + timedelta(minutes=30), end_time + timedelta(minutes=30), party_size=2)
        assert booked_table not in free_tables_overlap
        assert len(free_tables_overlap) == 3

    def test_business_hours_validation(self, setup_data):
        branch = setup_data["branch"]
        
        # 10:00 AM is outside business hours (11 AM to 11 PM)
        bad_time = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        
        with pytest.raises(ValidationError):
            ReservationService.create_reservation(
                branch_id=branch.id,
                guest_name="Early Bird",
                guest_phone="+918888888888",
                party_size=2,
                start_time=bad_time
            )

    def test_reservation_status_transitions(self, setup_data):
        branch = setup_data["branch"]
        start = timezone.now().replace(hour=19, minute=0, second=0, microsecond=0)

        # 1. Create confirmed booking
        res = ReservationService.create_reservation(
            branch_id=branch.id,
            guest_name="Transition Guest",
            guest_phone="+918888888888",
            party_size=2,
            start_time=start,
            status='confirmed'
        )
        assert res.status == 'confirmed'
        table = res.reservation_tables.first().table
        assert table.status == 'available'

        # 2. Check in guest (Check in state)
        checked_in_res = ReservationService.check_in_guest(res.id)
        assert checked_in_res.status == 'arrived'
        table.refresh_from_db()
        assert table.status == 'occupied'

        # Seating guest (Seated/Dining state)
        seated_res = ReservationService.seat_guest(res.id)
        assert seated_res.status == 'seated'
        table.refresh_from_db()
        assert table.status == 'occupied'

        # 3. Checkout guest (Release table)
        completed_res = ReservationService.check_out_guest(res.id)
        assert completed_res.status == 'completed'
        table.refresh_from_db()
        assert table.status == 'available'

    def test_waitlist_flows_and_estimations(self, setup_data):
        branch = setup_data["branch"]
        
        # 1. Join Waitlist
        w1 = WaitlistService.join_waitlist(
            branch_id=branch.id,
            guest_name="Wait Group 1",
            guest_phone="+918888888888",
            party_size=2
        )
        assert w1.position == 1
        # Estimated wait time should be computed
        assert w1.estimated_wait_minutes > 0

        # Join Waitlist 2nd group
        w2 = WaitlistService.join_waitlist(
            branch_id=branch.id,
            guest_name="Wait Group 2",
            guest_phone="+918888888888",
            party_size=4
        )
        assert w2.position == 2

        # 2. Notify guest
        notified_w1 = WaitlistService.notify_guest(w1.id)
        assert notified_w1.status == 'notified'
        assert notified_w1.notified_at is not None

        # 3. Promote guest to available Table 1
        t1 = Table.objects.get(branch=branch, number="Table 1")
        promo_res = WaitlistService.promote_and_check_in(w1.id, [t1.id])
        assert promo_res.status == 'seated'
        t1.refresh_from_db()
        assert t1.status == 'occupied'

        # 4. Verify waitlist queue re-ordered
        w2.refresh_from_db()
        assert w2.position == 1

    def test_celery_no_show_auto_cancellation(self, setup_data):
        branch = setup_data["branch"]
        
        # 1. Create a confirmed reservation set 20 minutes in the past
        past_start = timezone.now() - timedelta(minutes=20)
        res = Reservation.objects.create(
            branch=branch,
            guest_name="No Show Guest",
            guest_phone="+918888888888",
            party_size=2,
            start_time=past_start,
            end_time=past_start + timedelta(hours=2),
            status='confirmed'
        )
        
        # Map a table
        t1 = Table.objects.get(branch=branch, number="Table 1")
        ReservationTable.objects.create(reservation=res, table=t1)

        # 2. Trigger Celery Task
        result = check_no_show_bookings()
        assert "Processed 1 no-show bookings" in result

        # 3. Assert status updated
        res.refresh_from_db()
        assert res.status == 'no_show'
        # Table map should be released
        assert ReservationTable.objects.filter(reservation=res).count() == 0

    def test_celery_waitlist_auto_expiry(self, setup_data):
        branch = setup_data["branch"]
        
        # 1. Create notified waitlist entry set 20 minutes in the past
        past_notify = timezone.now() - timedelta(minutes=20)
        wait = Waitlist.objects.create(
            branch=branch,
            guest_name="Late Wait Guest",
            guest_phone="+918888888888",
            party_size=2,
            status='notified',
            notified_at=past_notify
        )

        # 2. Trigger Celery Task
        result = auto_expire_waitlist_notifications()
        assert "Expired 1 waitlist entries" in result

        # 3. Assert status updated
        wait.refresh_from_db()
        assert wait.status == 'expired'
