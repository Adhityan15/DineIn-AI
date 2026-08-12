import requests

login_url = "http://127.0.0.1:8000/api/v1/auth/login/"
payload = {
    "email": "admin",
    "password": "Password123!"
}

# 1. Login
res = requests.post(login_url, json=payload)
print(f"Login Response: {res.status_code}")
if res.status_code != 200:
    print(res.text)
    exit(1)

token = res.json().get("data", {}).get("access")
headers = {"Authorization": f"Bearer {token}"}

# 2. Get branches
branches_url = "http://127.0.0.1:8000/api/v1/branches/"
res = requests.get(branches_url, headers=headers)
print(f"Branches Status: {res.status_code}")
branches = res.json().get("data", [])
branch_id = next((b["id"] for b in branches if "Bangalore" in b["name"]), branches[0]["id"] if branches else "")
print(f"Using Branch ID: {branch_id}")

# 3. Query realtime-dashboard
realtime_url = f"http://127.0.0.1:8000/api/v1/branches/realtime-dashboard/?branch={branch_id}"
res = requests.get(realtime_url, headers=headers)
print(f"Realtime Dashboard API Status: {res.status_code}")
print(res.json())
