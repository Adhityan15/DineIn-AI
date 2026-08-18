import requests
import json

def test_production():
    base_url = "https://dinein-ai-v1-0.onrender.com"
    login_url = f"{base_url}/api/v1/auth/login/"
    insights_url = f"{base_url}/api/v1/inventory/menu-items/ai-insights/"
    
    print("Logging in to production...")
    try:
        login_res = requests.post(login_url, json={
            "username": "admin1",
            "password": "Admin@123"
        }, headers={"Content-Type": "application/json"}, timeout=10)
        
        if login_res.status_code != 200:
            print(f"Login failed! Status: {login_res.status_code}, Response: {login_res.text}")
            return
            
        token = login_res.json().get('access')
        print("Logged in successfully. Token acquired.")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "x-branch-id": "c25e6dd3-b6e7-436e-99ed-13c0e965eb03" # ADAMBAKKAM-CHENNAI branch ID
        }
        
        print("Fetching production ai-insights...")
        insights_res = requests.get(insights_url, headers=headers, timeout=15)
        print("Status code:", insights_res.status_code)
        
        if insights_res.status_code == 200:
            data = insights_res.json()
            print("Response success:", data.get('success'))
            matrix_data = data.get('data', {}).get('matrix', {})
            print("Matrix summary:")
            for key, val in matrix_data.items():
                if isinstance(val, list):
                    print(f"  {key}: {len(val)} items")
                else:
                    print(f"  {key}: {val}")
        else:
            print("Error response:", insights_res.text)
            
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    test_production()
