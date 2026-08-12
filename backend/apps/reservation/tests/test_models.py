import pytest
from django.db.utils import IntegrityError
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from apps.core.models import Branch, Restaurant
from apps.reservation.models import Table, Reservation, ReservationTable, Waitlist

@pytest.mark.django_db
class TestReservationModels:

    @pytest.fixture
    def branch(self):
        restaurant = Restaurant.objects.create(
            name="DineIn Corp",
            code="dinein-corp",
            contact_email="corp@dinein.com",
            contact_phone="+15005550006",
            address="Corporate Office"
        )
        return Branch.objects.create(
            restaurant=restaurant,
            name="Main Branch",
            branch_code="main-branch",
            address="Bangalore"
        )

    def test_table_creation_and_uniqueness(self, branch):
        # 1. Create a valid table
        table1 = Table.objects.create(
            branch=branch,
            number="Table 1",
            capacity=4,
            status="available"
        )
        assert str(table1) == f"Table 1 (Cap: 4) - Main Branch"

        # 2. Try creating duplicate table under same branch
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Table.objects.create(
                    branch=branch,
                    number="Table 1",
                    capacity=2
                )

    def test_reservation_creation_and_constraints(self, branch):
        start = timezone.now()
        end = start + timedelta(hours=2)

        # 1. Create a valid reservation
        res = Reservation.objects.create(
            branch=branch,
            guest_name="Guest Test",
            guest_phone="+918888888888",
            guest_email="guest@test.com",
            party_size=4,
            start_time=start,
            end_time=end,
            status="confirmed",
            is_walk_in=True,
            is_birthday=True
        )
        assert res.is_walk_in is True
        assert res.is_birthday is True
        assert res.status == "confirmed"

        # 2. Check end_time > start_time constraint
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Reservation.objects.create(
                    branch=branch,
                    guest_name="Bad End Time",
                    guest_phone="+918888888888",
                    party_size=2,
                    start_time=start,
                    end_time=start - timedelta(minutes=10)
                )

        # 3. Check party_size > 0 constraint
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Reservation.objects.create(
                    branch=branch,
                    guest_name="Zero Pax",
                    guest_phone="+918888888888",
                    party_size=0,
                    start_time=start,
                    end_time=end
                )

    def test_reservation_table_junction(self, branch):
        start = timezone.now()
        end = start + timedelta(hours=2)

        res = Reservation.objects.create(
            branch=branch,
            guest_name="Junction Guest",
            guest_phone="+918888888888",
            party_size=4,
            start_time=start,
            end_time=end
        )

        table = Table.objects.create(
            branch=branch,
            number="Table 2",
            capacity=4
        )

        # Map table to reservation
        res_table = ReservationTable.objects.create(
            reservation=res,
            table=table
        )
        assert str(res_table) == "Junction Guest ➔ Table 2"

        # Duplicate mapping should raise IntegrityError
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                ReservationTable.objects.create(
                    reservation=res,
                    table=table
                )

    def test_waitlist_creation(self, branch):
        wait = Waitlist.objects.create(
            branch=branch,
            guest_name="Wait Guest",
            guest_phone="+918888888888",
            party_size=2,
            position=1,
            status="waiting"
        )
        assert str(wait) == "Wait Guest (Position: 1) - waiting"

    def test_phone_validation_error(self, branch):
        start = timezone.now()
        end = start + timedelta(hours=2)

        # Create reservation with bad phone format
        res = Reservation(
            branch=branch,
            guest_name="Bad Phone",
            guest_phone="12345",  # Invalid formatting
            party_size=2,
            start_time=start,
            end_time=end
        )
        
        # Saving directly bypasses validator, but full_clean raises ValidationError
        with pytest.raises(ValidationError):
            res.full_clean()
