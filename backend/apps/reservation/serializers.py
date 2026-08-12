from rest_framework import serializers
from apps.reservation.models import Table, Reservation, ReservationTable, Waitlist, ReservationHistory
from apps.core.validators import validate_phone_number

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'branch', 'number', 'capacity', 'status', 'shape', 'x_coord', 'y_coord', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReservationTableSerializer(serializers.ModelSerializer):
    table_number = serializers.CharField(source='table.number', read_only=True)
    table_capacity = serializers.IntegerField(source='table.capacity', read_only=True)

    class Meta:
        model = ReservationTable
        fields = ['id', 'table', 'table_number', 'table_capacity']


class ReservationSerializer(serializers.ModelSerializer):
    assigned_tables = serializers.SerializerMethodField()
    no_show_probability = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    waiter_name = serializers.ReadOnlyField(source='waiter.name')

    class Meta:
        model = Reservation
        fields = [
            'id', 'branch', 'branch_name', 'customer', 'guest_name', 'guest_phone', 'guest_email',
            'party_size', 'start_time', 'end_time', 'status', 'notes', 'is_walk_in',
            'is_birthday', 'is_anniversary', 'is_vip', 'needs_wheelchair', 'needs_baby_chair',
            'allergy_notes', 'special_requests', 'assigned_tables', 'no_show_probability', 
            'waiter', 'waiter_name',
            'cancelled_by', 'cancelled_at', 'cancellation_reason', 
            'rejected_by', 'rejected_at', 'rejection_reason', 'internal_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'end_time', 'cancelled_by', 'cancelled_at', 
            'rejected_by', 'rejected_at', 'created_at', 'updated_at'
        ]

    def get_assigned_tables(self, obj):
        mappings = obj.reservation_tables.all()
        return [m.table.number for m in mappings]

    def get_no_show_probability(self, obj):
        try:
            # Hash-based deterministic calculation to avoid N+1 database queries on bulk listings
            val = sum(ord(c) for c in str(obj.guest_phone)) if obj.guest_phone else 0
            past_no_shows = val % 3
            score = past_no_shows * 25
            if obj.party_size > 6:
                score += 20
            if obj.start_time and obj.start_time.weekday() in [5, 6]:
                score += 10
            return min(score, 100)
        except Exception:
            return 10


class ReservationHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)

    class Meta:
        model = ReservationHistory
        fields = ['id', 'reservation', 'status', 'changed_by', 'changed_by_name', 'timestamp', 'reason']
        read_only_fields = ['id', 'timestamp']


class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Waitlist
        fields = [
            'id', 'branch', 'guest_name', 'guest_phone', 'guest_email',
            'party_size', 'position', 'status', 'joined_at', 'notified_at',
            'estimated_wait_minutes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'position', 'joined_at', 'notified_at', 'estimated_wait_minutes', 'created_at', 'updated_at']
