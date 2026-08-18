import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.core.models import Branch

def test():
    User = get_user_model()
    admin_user = User.objects.filter(username='admin1').first()
    
    client = APIClient()
    client.force_authenticate(user=admin_user)
    
    branch = Branch.objects.first()
    headers = {
        'HTTP_X_BRANCH_ID': str(branch.id) if branch else '',
        'HTTP_HOST': 'localhost'
    }
    
    try:
        print("Calling ai-insights via APIClient...")
        response = client.get('/api/v1/inventory/menu-items/ai-insights/', **headers)
        print("Status code:", response.status_code)
        
        with open('crashed_page.html', 'wb') as f:
            f.write(response.content)
        print("Wrote response content to crashed_page.html")
    except Exception as e:
        import traceback
        print("CRASHED with exception:", e)
        traceback.print_exc()

if __name__ == '__main__':
    test()
