import requests

login_url = "http://127.0.0.1:8000/api/v1/auth/login/"
payload = {
    "email": "admin",
    "password": "Password123!"
}

res = requests.post(login_url, json=payload)
print(f"Login Response: {res.status_code}")
print(res.json())
