import requests
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_workflow():
    print("1. Logging in as admin...")
    login_url = f"{BASE_URL}/auth/login/"
    res = requests.post(login_url, json={
        "email": "admin@dinein.com",
        "password": "Password123!"
    })
    if res.status_code != 200:
        print(f"Login failed: {res.status_code} | {res.text}")
        return
    token = res.json().get("access")
    print("Logged in successfully!")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("\n2. Fetching branches...")
    branches_url = f"{BASE_URL}/branches/"
    res = requests.get(branches_url, headers=headers)
    branches = res.json()
    if not branches:
        print("No branches found.")
        return
    default_branch = branches[0]
    branch_id = default_branch["id"]
    print(f"Using Branch: {default_branch['name']} (ID: {branch_id})")
    
    print("\n3. Creating a new reservation...")
    booking_url = f"{BASE_URL}/reservation/bookings/"
    import datetime
    start_time = (datetime.datetime.now() + datetime.timedelta(hours=2)).isoformat()
    booking_payload = {
        "branch": branch_id,
        "guest_name": "Integration Test Guest",
        "guest_phone": "+15559990001",
        "guest_email": "testguest@dinein.com",
        "party_size": 2,
        "start_time": start_time
    }
    res = requests.post(booking_url, json=booking_payload, headers=headers)
    if res.status_code not in [200, 201]:
        print(f"Create booking failed: {res.status_code} | {res.text}")
        return
    booking = res.json().get("data", res.json())
    booking_id = booking["id"]
    print(f"Reservation created successfully! ID: {booking_id} | Status: {booking['status']}")
    
    # 4. Approve
    print("\n4. Approving reservation...")
    res = requests.post(f"{booking_url}{booking_id}/approve/", headers=headers)
    booking = res.json().get("data", res.json())
    print(f"Status after Approve: {booking['status']}")
    
    # 5. Check in
    print("\n5. Checking in guest (arrived)...")
    res = requests.post(f"{booking_url}{booking_id}/check-in/", headers=headers)
    booking = res.json().get("data", res.json())
    print(f"Status after Check-in: {booking['status']}")
    
    # Check tables status
    assigned_tables = booking.get("assigned_tables", [])
    print(f"Assigned Tables: {assigned_tables}")
    
    tables_res = requests.get(f"{BASE_URL}/reservation/tables/", headers=headers, params={"branch": branch_id})
    tables = tables_res.json().get("data", tables_res.json())
    for t in tables:
        if t["number"] in assigned_tables:
            print(f"  Table T-{t['number']} Status: {t['status']}")
            
    # 6. Seat
    print("\n6. Seating guest...")
    res = requests.post(f"{booking_url}{booking_id}/seat/", headers=headers)
    booking = res.json().get("data", res.json())
    print(f"Status after Seating: {booking['status']}")
    
    # Check tables status
    tables_res = requests.get(f"{BASE_URL}/reservation/tables/", headers=headers, params={"branch": branch_id})
    tables = tables_res.json().get("data", tables_res.json())
    for t in tables:
        if t["number"] in assigned_tables:
            print(f"  Table T-{t['number']} Status: {t['status']}")

    # 7. Start Dining
    print("\n7. Starting dining session...")
    res = requests.post(f"{booking_url}{booking_id}/start-dining/", headers=headers)
    booking = res.json().get("data", res.json())
    print(f"Status after Start Dining: {booking['status']}")
    
    # 8. Request Checkout
    print("\n8. Requesting checkout...")
    res = requests.post(f"{booking_url}{booking_id}/request-checkout/", headers=headers)
    booking = res.json().get("data", res.json())
    print(f"Status after Request Checkout: {booking['status']}")
    
    # 9. Complete Checkout
    print("\n9. Completing checkout...")
    res = requests.post(f"{booking_url}{booking_id}/check-out/", headers=headers)
    booking = res.json().get("data", res.json())
    print(f"Status after Complete Checkout: {booking['status']}")
    
    # Check table status (should be cleaning)
    tables_res = requests.get(f"{BASE_URL}/reservation/tables/", headers=headers, params={"branch": branch_id})
    tables = tables_res.json().get("data", tables_res.json())
    for t in tables:
        if t["number"] in assigned_tables:
            print(f"  Table T-{t['number']} Status (immediately after checkout): {t['status']}")
            
    # 10. Wait 10.5 seconds for cleaning to complete
    print("\n10. Waiting 11 seconds for table cleaning completion timer...")
    time.sleep(11)
    
    tables_res = requests.get(f"{BASE_URL}/reservation/tables/", headers=headers, params={"branch": branch_id})
    tables = tables_res.json().get("data", tables_res.json())
    for t in tables:
        if t["number"] in assigned_tables:
            print(f"  Table T-{t['number']} Status (after cleaning delay): {t['status']}")

if __name__ == "__main__":
    test_workflow()
