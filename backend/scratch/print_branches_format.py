import requests
res = requests.post("http://127.0.0.1:8000/api/v1/auth/login/", json={
    "email": "e2e_admin",
    "password": "Password123!"
})
token = res.json().get("data", {}).get("access")
headers = {"Authorization": f"Bearer {token}"}
res = requests.get("http://127.0.0.1:8000/api/v1/branches/", headers=headers)
print("Branches Response:", res.status_code)
print("Response body:", res.json())
