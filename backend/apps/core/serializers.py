from rest_framework import serializers
from apps.core.models import Branch

class BranchSerializer(serializers.ModelSerializer):
    manager_name = serializers.ReadOnlyField(source='branch_manager.name')
    manager_email = serializers.ReadOnlyField(source='branch_manager.email')

    class Meta:
        model = Branch
        fields = (
            'id', 'name', 'branch_code', 'latitude', 'longitude', 'geofence_radius', 
            'address', 'is_active', 'is_default', 'is_cloud_kitchen',
            'branch_manager', 'manager_name', 'manager_email', 'gst_number', 'status',
            'tax_percentage', 'contact_number', 'business_hours', 'kitchen_type', 'delivery_radius',
            'service_charge_percentage', 'logo_url', 'receipt_footer', 'invoice_prefix', 'invoice_sequence',
            'currency', 'tax_rules'
        )

    def validate_name(self, value):
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError("Branch name must be at least 3 characters long.")
        return value.strip()

    def validate_address(self, value):
        if not value or len(value.strip()) < 5:
            raise serializers.ValidationError("Address must be at least 5 characters long.")
        return value.strip()

    def validate_latitude(self, value):
        if value is not None:
            if not (-90 <= value <= 90):
                raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is not None:
            if not (-180 <= value <= 180):
                raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate_geofence_radius(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Geofence radius must be a positive integer.")
        return value

    def validate(self, attrs):
        name = attrs.get('name')
        branch_code = attrs.get('branch_code')
        branch_manager = attrs.get('branch_manager')
        
        # Check name unique
        if name:
            qs_name = Branch.objects.filter(name__iexact=name)
            if self.instance:
                qs_name = qs_name.exclude(id=self.instance.id)
            if qs_name.exists():
                raise serializers.ValidationError({"name": "Branch name already exists."})
            
        # Check branch_code unique
        if branch_code:
            qs_code = Branch.objects.filter(branch_code__iexact=branch_code)
            if self.instance:
                qs_code = qs_code.exclude(id=self.instance.id)
            if qs_code.exists():
                raise serializers.ValidationError({"branch_code": "Branch slug code already exists."})

        # Check manager unique assignment
        if branch_manager:
            qs_manager = Branch.objects.filter(branch_manager=branch_manager)
            if self.instance:
                qs_manager = qs_manager.exclude(id=self.instance.id)
            if qs_manager.exists():
                raise serializers.ValidationError({"branch_manager": "Manager already assigned to another branch."})
                
        return attrs


from apps.core.models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    waiter_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    cashier_name = serializers.ReadOnlyField(source='cashier.name')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('waiter_name') and instance.waiter:
            ret['waiter_name'] = instance.waiter.name
        return ret

    class Meta:
        model = Invoice
        fields = '__all__'

from apps.core.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = AuditLog
        fields = '__all__'

