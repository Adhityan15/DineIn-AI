import uuid
from django.db import models
from django.conf import settings
from apps.core.models import BaseModel, Branch

def gen_qr():
    return f"EMP-QR-{str(uuid.uuid4())[:8].upper()}"

class Department(BaseModel):
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='departments')
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=50, unique=True)
    head = models.ForeignKey('Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    status = models.CharField(max_length=20, default='active')
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name


class Designation(BaseModel):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='designations')
    hierarchy_level = models.IntegerField(default=1)  # 1: Staff, 2: Lead, 3: Supervisor, 4: Manager, 5: Director/Head
    approval_authority = models.BooleanField(default=False)
    salary_grade_min = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    salary_grade_max = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.name} ({self.department.name})"


class Employee(BaseModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('terminated', 'Terminated'),
        ('on_leave', 'On Leave'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee')
    employee_id = models.CharField(max_length=30, unique=True)
    designation = models.ForeignKey(Designation, on_delete=models.PROTECT, related_name='employees')
    hire_date = models.DateField()
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    skills = models.CharField(max_length=255, blank=True, help_text="Comma-separated skills matrix. e.g. cashier, kitchen, barista")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Redesigned HRMS additions
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    qr_code_id = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    promotion_date = models.DateField(null=True, blank=True)
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    increment_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    exit_date = models.DateField(null=True, blank=True)
    exit_reason = models.TextField(null=True, blank=True)
    shift = models.ForeignKey('Shift', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_employees')
    education = models.CharField(max_length=255, blank=True)
    experience_summary = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.qr_code_id:
            self.qr_code_id = f"EMP-QR-{str(uuid.uuid4())[:8].upper()}"
        if not self.joining_date:
            self.joining_date = self.hire_date
        if not self.branch and self.user and self.user.branch:
            self.branch = self.user.branch
        super().save(*args, **kwargs)

    def get_reporting_chain(self):
        chain = []
        current = self.manager
        visited = set()
        while current and current.id not in visited:
            visited.add(current.id)
            chain.append({
                "id": str(current.id),
                "employee_id": current.employee_id,
                "name": current.user.get_full_name() or current.user.username,
                "designation": current.designation.name if current.designation else "Staff",
                "email": current.user.email
            })
            current = current.manager
        return chain

    def get_subordinates(self):
        return [
            {
                "id": str(sub.id),
                "employee_id": sub.employee_id,
                "name": sub.user.get_full_name() or sub.user.username,
                "designation": sub.designation.name if sub.designation else "Staff",
                "status": sub.status
            }
            for sub in self.subordinates.all()
        ]

    def __str__(self):
        return f"{self.user.email} - {self.employee_id}"


class EmployeeDocument(BaseModel):
    DOCUMENT_CHOICES = (
        ('aadhaar', 'Aadhaar Card'),
        ('pan', 'PAN Card'),
        ('passport', 'Passport'),
        ('driving_license', 'Driving License'),
        ('certificate', 'Certificate'),
        ('resume', 'Resume'),
        ('agreement', 'Employment Agreement'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DOCUMENT_CHOICES)
    document_number = models.CharField(max_length=100, blank=True)
    file_url = models.CharField(max_length=500, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.employee_id} - {self.document_type}"


class EmployeeTimelineEvent(BaseModel):
    EVENT_CHOICES = (
        ('joined', 'Joined'),
        ('promotion', 'Promotion'),
        ('increment', 'Salary Increment'),
        ('award', 'Award Recipient'),
        ('warning', 'Warning Logged'),
        ('transferred', 'Transferred'),
        ('resigned', 'Resigned'),
        ('terminated', 'Terminated'),
        ('other', 'Other Lifecycle Event'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='timeline_events')
    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_date = models.DateField()

    def __str__(self):
        return f"{self.employee.employee_id} - {self.title} ({self.event_date})"


class EmployeeAsset(BaseModel):
    ASSET_CHOICES = (
        ('laptop', 'Laptop'),
        ('pos', 'POS Terminal'),
        ('card', 'Access Card'),
        ('keys', 'Physical Keys'),
        ('uniform', 'Uniform'),
        ('other', 'Other Equipment'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assets')
    asset_type = models.CharField(max_length=30, choices=ASSET_CHOICES)
    asset_name = models.CharField(max_length=150)
    serial_number = models.CharField(max_length=150, blank=True)
    assigned_date = models.DateField()
    returned = models.BooleanField(default=False)
    returned_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee.employee_id} - {self.asset_name} ({'Returned' if self.returned else 'Issued'})"


class EmployeeAward(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='awards')
    title = models.CharField(max_length=200)
    award_date = models.DateField()
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.employee.employee_id} - {self.title}"


class Shift(BaseModel):
    name = models.CharField(max_length=100)  # e.g., Morning Service, Night Cleaning
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_minutes = models.IntegerField(default=60)

    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"


class Schedule(BaseModel):
    SWAP_STATUS_CHOICES = (
        ('none', 'None'),
        ('requested', 'Swap Requested by Employee A'),
        ('accepted', 'Swap Accepted by Employee B (Pending Approval)'),
        ('approved', 'Swap Approved by Manager'),
        ('rejected', 'Swap Rejected by Manager'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='schedules')
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE)
    date = models.DateField()
    
    # Three-step Shift Swapping fields
    is_swap_requested = models.BooleanField(default=False)
    swap_target = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='swap_targets')
    swap_status = models.CharField(max_length=20, choices=SWAP_STATUS_CHOICES, default='none')
    
    assigned_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_schedules')
    remarks = models.TextField(blank=True)

    class Meta:
        unique_together = ('employee', 'date', 'shift')

    def __str__(self):
        return f"{self.employee.employee_id} scheduled for {self.shift.name} on {self.date}"


class Attendance(BaseModel):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('late', 'Late'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('leave', 'Leave'),
        ('holiday', 'Holiday'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    
    # GPS validation fields
    clock_in_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    clock_in_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_late = models.BooleanField(default=False)
    is_anomaly = models.BooleanField(default=False)  # True if clocked in outside branch geofence boundary
    
    # QR Code Verification
    qr_code_scanned = models.BooleanField(default=False)
    
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    
    break_minutes = models.IntegerField(default=0)
    marked_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='marked_attendances')
    working_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    late_minutes = models.IntegerField(default=0)

    class Meta:
        unique_together = ('employee', 'date')

    def save(self, *args, **kwargs):
        from decimal import Decimal
        if self.clock_in and self.clock_out:
            diff = self.clock_out - self.clock_in
            hrs = diff.total_seconds() / 3600.0
            self.working_hours = Decimal(str(max(0.0, round(hrs - (self.break_minutes / 60.0), 2))))
        else:
            self.working_hours = Decimal('0.00')

        try:
            schedule = Schedule.objects.filter(employee=self.employee, date=self.date).first()
            if schedule and schedule.shift:
                shift = schedule.shift
                shift_start = shift.start_time
                shift_end = shift.end_time
                
                if self.clock_in:
                    in_time = self.clock_in.time()
                    if in_time > shift_start:
                        import datetime
                        dummy_date = datetime.date(2000, 1, 1)
                        dt_in = datetime.datetime.combine(dummy_date, in_time)
                        dt_start = datetime.datetime.combine(dummy_date, shift_start)
                        diff_min = (dt_in - dt_start).total_seconds() / 60.0
                        self.late_minutes = max(0, int(diff_min))
                        if self.late_minutes > 5:
                            self.status = 'late'
                            self.is_late = True
                    else:
                        self.late_minutes = 0
                
                if self.working_hours > 0:
                    import datetime
                    dummy_date = datetime.date(2000, 1, 1)
                    dt_end = datetime.datetime.combine(dummy_date, shift_end)
                    dt_start = datetime.datetime.combine(dummy_date, shift_start)
                    shift_duration = (dt_end - dt_start).total_seconds() / 3600.0
                    self.overtime_hours = Decimal(str(max(0.0, round(float(self.working_hours) - shift_duration, 2))))
        except Exception:
            pass

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.employee_id} attendance: {self.date} ({self.status})"


class LeaveType(BaseModel):
    name = models.CharField(max_length=50)  # e.g., Annual Leave, Sick Leave, Unpaid Leave
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.name


class Leave(BaseModel):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_rosters')

    def __str__(self):
        return f"{self.employee.employee_id} leave: {self.start_date} to {self.end_date} ({self.status})"


class PerformanceReview(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='reviews_given')
    review_date = models.DateField()
    score = models.IntegerField()  # Rating from 1 to 5
    feedback = models.TextField()
    burnout_risk = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  # Calculated score (0.00 to 100.00)

    def __str__(self):
        return f"Review for {self.employee.employee_id} (Score: {self.score})"


class EmployeeBreak(BaseModel):
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='breaks')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    is_paid = models.BooleanField(default=True)
    description = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f"Break for {self.attendance.employee.employee_id} on {self.attendance.date}"


class HolidayCalendar(BaseModel):
    name = models.CharField(max_length=150)
    date = models.DateField(unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.date})"


class EmployeeAvailability(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='availabilities')
    available_from = models.DateField()
    available_to = models.DateField()
    status = models.CharField(max_length=20, default='available') # available, unavailable
    remarks = models.TextField(blank=True)

    def __str__(self):
        return f"{self.employee.employee_id} availability: {self.available_from} to {self.available_to} ({self.status})"


class PayrollSummary(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payroll_summaries')
    month = models.CharField(max_length=7) # YYYY-MM
    working_days = models.IntegerField(default=0)
    working_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    leave_days = models.IntegerField(default=0)
    generated_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payroll Summary: {self.employee.employee_id} for {self.month}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Leave)
def notify_employee_leave_decision(sender, instance, created, **kwargs):
    if instance.status in ['approved', 'rejected']:
        try:
            from apps.notifications.models import Notification
            user = instance.employee.user
            Notification.objects.create(
                user=user,
                title=f"Leave Request {instance.status.title()}",
                message=f"Your leave request for {instance.start_date} to {instance.end_date} has been {instance.status}.",
                notification_type='system'
            )
        except Exception:
            pass


@receiver(post_save, sender=Employee)
def sync_employee_to_user_and_modules(sender, instance, created, **kwargs):
    user = instance.user
    save_user = False
    
    # 1. Sync User Branch
    if instance.branch and user.branch != instance.branch:
        user.branch = instance.branch
        save_user = True
        
    # 2. Sync Active Login Status
    if instance.status in ['suspended', 'terminated']:
        if user.is_active:
            user.is_active = False
            save_user = True
    elif instance.status in ['active', 'on_leave']:
        if not user.is_active:
            user.is_active = True
            save_user = True
            
    if save_user:
        user.save()
