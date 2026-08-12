import requests

login_url = "http://127.0.0.1:8000/api/v1/auth/login/"
payload = {
    "username": "admin",
    "password": "2101" # Let's try standard password from user's MySQL or common seed
}
# Let's check user credentials from seed_roles_permissions or others
# Wait! Let's search for test users first.
