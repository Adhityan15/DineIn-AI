from rest_framework import serializers
from .models import (
    NotificationChannelSettings,
    EmailTemplate,
    CommunicationLog,
    Campaign,
    InAppNotification,
    WhatsAppTemplate
)

class NotificationChannelSettingsSerializer(serializers.ModelSerializer):
    branch_name = serializers.ReadOnlyField(source='branch.name')

    class Meta:
        model = NotificationChannelSettings
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.smtp_password:
            ret['smtp_password'] = "************"
        else:
            ret['smtp_password'] = ""
            
        if instance.gateway_api_key:
            ret['gateway_api_key'] = "************"
        else:
            ret['gateway_api_key'] = ""

        if instance.whatsapp_meta_token:
            ret['whatsapp_meta_token'] = "************"
        else:
            ret['whatsapp_meta_token'] = ""
        return ret


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'


class CommunicationLogSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.username')

    class Meta:
        model = CommunicationLog
        fields = '__all__'


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'


class InAppNotificationSerializer(serializers.ModelSerializer):
    branch_name = serializers.ReadOnlyField(source='branch.name')
    class Meta:
        model = InAppNotification
        fields = '__all__'


from .models import Announcement, AnnouncementAcknowledgment

class AnnouncementAcknowledgmentSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    role_name = serializers.ReadOnlyField(source='user.role.name')
    class Meta:
        model = AnnouncementAcknowledgment
        fields = '__all__'


class AnnouncementSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    branch_name = serializers.ReadOnlyField(source='branch.name')
    read_count = serializers.SerializerMethodField()
    acknowledged = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = '__all__'
        
    def get_read_count(self, obj):
        return obj.acknowledgments.count()
        
    def get_acknowledged(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.acknowledgments.filter(user=request.user).exists()
        return False


class WhatsAppTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppTemplate
        fields = '__all__'
