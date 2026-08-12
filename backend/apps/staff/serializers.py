from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.staff.models import (
    Department, Designation, Employee, Shift, Schedule, Attendance, LeaveType, Leave, PerformanceReview,
    EmployeeDocument, EmployeeTimelineEvent, EmployeeAsset, EmployeeAward, EmployeeBreak, HolidayCalendar,
    EmployeeAvailability, PayrollSummary
)

User = get_user_model()


class EmployeeBreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeBreak
        fields = ['id', 'attendance', 'start_time', 'end_time', 'is_paid', 'description']
        read_only_fields = ['id']


class HolidayCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = HolidayCalendar
        fields = ['id', 'name', 'date', 'description']
        read_only_fields = ['id']

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = ['id', 'employee', 'document_type', 'document_number', 'file_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class EmployeeTimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeTimelineEvent
        fields = ['id', 'employee', 'event_type', 'title', 'description', 'event_date']
        read_only_fields = ['id']


class EmployeeAssetSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_id')

    class Meta:
        model = EmployeeAsset
        fields = ['id', 'employee', 'employee_name', 'employee_code', 'asset_type', 'asset_name', 'serial_number', 'assigned_date', 'returned', 'returned_date']
        read_only_fields = ['id']


class EmployeeAwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAward
        fields = ['id', 'employee', 'title', 'award_date', 'description']
        read_only_fields = ['id']


class DepartmentSerializer(serializers.ModelSerializer):
    branch_name = serializers.ReadOnlyField(source='branch.name')
    head_name = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'branch', 'branch_name', 'name', 'code', 'head', 'head_name', 'status', 'budget', 'employee_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_head_name(self, obj):
        if obj.head and obj.head.user:
            return obj.head.user.get_full_name() or obj.head.user.username
        return None

    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Designation
        fields = [
            'id', 'name', 'department', 'department_name', 'hierarchy_level',
            'approval_authority', 'salary_grade_min', 'salary_grade_max', 'employee_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


class EmployeeSerializer(serializers.ModelSerializer):
    email = serializers.ReadOnlyField(source='user.email')
    name = serializers.SerializerMethodField()
    designation_name = serializers.ReadOnlyField(source='designation.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    manager_name = serializers.SerializerMethodField()
    branch_name = serializers.ReadOnlyField(source='branch.name')
    shift_name = serializers.ReadOnlyField(source='shift.name')
    reporting_chain = serializers.SerializerMethodField()
    subordinates = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'email', 'name', 'employee_id', 'designation',
            'designation_name', 'department', 'department_name', 'hire_date', 'hourly_rate',
            'profile_image', 'skills', 'status', 'created_at',
            'manager', 'manager_name', 'branch', 'branch_name',
            'qr_code_id', 'date_of_birth', 'joining_date', 'promotion_date',
            'salary', 'increment_amount', 'exit_date', 'exit_reason',
            'shift', 'shift_name', 'education', 'experience_summary',
            'emergency_contact_name', 'emergency_contact_phone', 'notes',
            'reporting_chain', 'subordinates'
        ]
        read_only_fields = ['id', 'created_at', 'qr_code_id']

    def get_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return ""

    def get_manager_name(self, obj):
        if obj.manager and obj.manager.user:
            return obj.manager.user.get_full_name() or obj.manager.user.username
        return None

    def get_reporting_chain(self, obj):
        return obj.get_reporting_chain()

    def get_subordinates(self, obj):
        return obj.get_subordinates()


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = ['id', 'name', 'start_time', 'end_time', 'created_at']
        read_only_fields = ['id', 'created_at']


class ScheduleSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_id')
    shift_name = serializers.ReadOnlyField(source='shift.name')
    shift_start = serializers.ReadOnlyField(source='shift.start_time')
    shift_end = serializers.ReadOnlyField(source='shift.end_time')
    swap_target_name = serializers.ReadOnlyField(source='swap_target.user.name')

    class Meta:
        model = Schedule
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'shift',
            'shift_name', 'shift_start', 'shift_end', 'date',
            'is_swap_requested', 'swap_target', 'swap_target_name', 'swap_status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_id')
    designation_name = serializers.ReadOnlyField(source='employee.designation.name')
    breaks = EmployeeBreakSerializer(many=True, read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'designation_name',
            'date', 'clock_in', 'clock_out', 'clock_in_latitude', 'clock_in_longitude',
            'is_late', 'is_anomaly', 'qr_code_scanned', 'overtime_hours', 'status', 'breaks', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'code', 'created_at']
        read_only_fields = ['id', 'created_at']


class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_id')
    leave_type_name = serializers.ReadOnlyField(source='leave_type.name')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.user.name')

    class Meta:
        model = Leave
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'leave_type',
            'leave_type_name', 'start_date', 'end_date', 'reason', 'status',
            'approved_by', 'approved_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.name')
    reviewer_name = serializers.ReadOnlyField(source='reviewer.user.name')

    class Meta:
        model = PerformanceReview
        fields = ['id', 'employee', 'employee_name', 'reviewer', 'reviewer_name', 'review_date', 'score', 'feedback', 'burnout_risk', 'created_at']
        read_only_fields = ['id', 'created_at']


class EmployeeAvailabilitySerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_id')

    class Meta:
        model = EmployeeAvailability
        fields = ['id', 'employee', 'employee_name', 'employee_code', 'available_from', 'available_to', 'status', 'remarks', 'created_at']
        read_only_fields = ['id', 'created_at']


class PayrollSummarySerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_id')

    class Meta:
        model = PayrollSummary
        fields = ['id', 'employee', 'employee_name', 'employee_code', 'month', 'working_days', 'working_hours', 'overtime_hours', 'leave_days', 'generated_on']
        read_only_fields = ['id', 'generated_on']
