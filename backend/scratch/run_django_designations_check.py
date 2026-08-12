import os
import sys
sys.path.append(os.getcwd())

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.staff.views import DesignationViewSet
from django.contrib.auth import get_user_model

User = get_user_model()
admin_user = User.objects.filter(role__code="admin").first()

factory = APIRequestFactory()
request = factory.get('/api/v1/workforce/designations/')
force_authenticate(request, user=admin_user)

view = DesignationViewSet.as_view({'get': 'list'})
response = view(request)
response.render()
print("Response Status Code:", response.status_code)
print("Response Data type:", type(response.data))
print("Response Content:", response.content.decode('utf-8'))
