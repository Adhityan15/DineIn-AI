import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from rest_framework.test import APIClient

def test():
    client = APIClient()
    print("Testing local login endpoint via APIClient...")
    try:
        response = client.post('/api/v1/auth/login/', {
            "email": "admin1",
            "password": "Admin@123"
        }, HTTP_HOST='localhost')
        print("Status code:", response.status_code)
        print("Response headers:", response.headers)
        if response.status_code == 500:
            # Save HTML/text to inspect the traceback
            with open('login_error.html', 'wb') as f:
                f.write(response.content)
            print("Wrote response to login_error.html")
        else:
            print("Response:", response.data if hasattr(response, 'data') else response.content)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test()
