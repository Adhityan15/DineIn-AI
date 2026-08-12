import requests
res = requests.post("http://127.0.0.1:8000/api/v1/auth/login/", json={
    "email": "e2e_admin",
    "password": "Password123!"
})
print("Login status:", res.status_code)
print("Keys:", list(res.json().keys()) if res.status_code == 200 else res.text)
if res.status_code == 200:
    print("Full response:", res.json())
