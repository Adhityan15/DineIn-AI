import pytest
import json
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from apps.authentication.models import Role, UserProfile
from apps.core.models import AuditLog

User = get_user_model()

@pytest.mark.django_db
def test_user_registration_validation(api_client):
    """
    Verify user registration validation rules (unique email/username, password strength, confirmation mismatch).
    """
    url = reverse('auth_register')
    
    # 1. Success registration
    payload = {
        "email": "customer@dinein.com",
        "username": "customer123",
        "password": "StrongPassword123!",
        "password_confirm": "StrongPassword123!",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+15005550006",
        "role": "customer"
    }
    response = api_client.post(url, payload)
    assert response.status_code == status.HTTP_201_CREATED
    
    # Verify standard API response format
    rendered_data = json.loads(response.content)
    assert rendered_data['success'] is True
    assert rendered_data['message'] == "Registration successful."
    assert "user" in rendered_data['data']
    assert User.objects.filter(email="customer@dinein.com").exists()
    
    # Verify UserProfile created automatically
    user = User.objects.get(email="customer@dinein.com")
    assert UserProfile.objects.filter(user=user).exists()
    assert AuditLog.objects.filter(user=user, action="User Account Registered").exists()

    # 2. Duplicate email failure
    response = api_client.post(url, payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    rendered_data = json.loads(response.content)
    assert rendered_data['success'] is False
    assert "email" in rendered_data['data']

    # 3. Duplicate username failure
    payload["email"] = "another@dinein.com"
    response = api_client.post(url, payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    rendered_data = json.loads(response.content)
    assert "username" in rendered_data['data']

    # 4. Weak password failure (no uppercase, no special char)
    payload["username"] = "another_user"
    payload["password"] = "weakpwd"
    payload["password_confirm"] = "weakpwd"
    response = api_client.post(url, payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    rendered_data = json.loads(response.content)
    assert "password" in rendered_data['data']

    # 5. Password confirmation mismatch failure
    payload["password"] = "StrongPassword123!"
    payload["password_confirm"] = "DifferentPassword123!"
    response = api_client.post(url, payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    rendered_data = json.loads(response.content)
    assert "password_confirm" in rendered_data['data']


@pytest.mark.django_db
def test_login_email_or_username(api_client, test_user):
    """
    Verify login using both email and username.
    """
    url = reverse('auth_login')
    
    # 1. Login with email
    payload = {
        "email": "test@dinein.com",
        "password": "Testpassword123!"
    }
    response = api_client.post(url, payload)
    assert response.status_code == status.HTTP_200_OK
    
    rendered_data = json.loads(response.content)
    assert rendered_data['success'] is True
    assert rendered_data['message'] == "Login successful."
    assert "access" in rendered_data['data']
    assert "refresh" in rendered_data['data']
    assert rendered_data['data']['user']['email'] == test_user.email
    assert rendered_data['data']['user']['role'] == "customer"
    
    # Verify AuditLog created
    assert AuditLog.objects.filter(user=test_user, action="User Login Successful").exists()

    # 2. Login with username
    payload = {
        "email": "testuser", # username in email field
        "password": "Testpassword123!"
    }
    response = api_client.post(url, payload)
    assert response.status_code == status.HTTP_200_OK
    rendered_data = json.loads(response.content)
    assert "access" in rendered_data['data']


@pytest.mark.django_db
def test_account_lockout_after_failed_logins(api_client, test_user):
    """
    Verify account locks out after 5 consecutive failed login attempts.
    """
    url = reverse('auth_login')
    payload = {
        "email": test_user.email,
        "password": "WrongPassword123!"
    }
    
    # Verify starting states
    assert test_user.failed_login_attempts == 0
    assert not test_user.is_locked
    
    # Perform 5 wrong attempts
    for i in range(5):
        response = api_client.post(url, payload)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
    test_user.refresh_from_db()
    assert test_user.failed_login_attempts == 5
    assert test_user.is_locked
    assert test_user.locked_until is not None
    
    # 6th attempt should return a locked error message
    response = api_client.post(url, payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    rendered_data = json.loads(response.content)
    assert rendered_data['success'] is False
    assert "locked" in rendered_data['data']['detail'][0]
    
    # Audit log check
    assert AuditLog.objects.filter(user=test_user, action__icontains="locked").exists()


@pytest.mark.django_db
def test_token_logout(api_client, test_user):
    """
    Verify secure token logout and blacklisting.
    """
    login_url = reverse('auth_login')
    logout_url = reverse('auth_logout')
    
    # Login to get refresh token
    payload = {
        "email": test_user.email,
        "password": "Testpassword123!"
    }
    login_response = api_client.post(login_url, payload)
    rendered_login = json.loads(login_response.content)
    access_token = rendered_login['data']['access']
    refresh_token = rendered_login['data']['refresh']
    
    # Authenticate api client
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Logout
    logout_response = api_client.post(logout_url, {"refresh": refresh_token})
    assert logout_response.status_code == status.HTTP_200_OK
    rendered_logout = json.loads(logout_response.content)
    assert rendered_logout['success'] is True
    assert rendered_logout['message'] == "Logout successful."
    
    # Verify AuditLog
    assert AuditLog.objects.filter(user=test_user, action="User Logged Out").exists()
    
    # Re-using blacklisted refresh token on refresh view should fail
    refresh_url = reverse('auth_token_refresh')
    refresh_response = api_client.post(refresh_url, {"refresh": refresh_token})
    assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_get_and_update_profile(api_client, test_user):
    """
    Verify profile retrieval and update endpoints.
    """
    profile_url = reverse('auth_profile')
    
    # Login to get access token
    login_url = reverse('auth_login')
    login_response = api_client.post(login_url, {
        "email": test_user.email,
        "password": "Testpassword123!"
    })
    rendered_login = json.loads(login_response.content)
    access_token = rendered_login['data']['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # GET profile
    get_response = api_client.get(profile_url)
    assert get_response.status_code == status.HTTP_200_OK
    rendered_get = json.loads(get_response.content)
    assert rendered_get['success'] is True
    assert rendered_get['message'] == "Profile retrieved successfully."
    assert rendered_get['data']['email'] == test_user.email
    assert rendered_get['data']['bio'] is None
    
    # PUT update profile
    update_payload = {
        "first_name": "UpdatedName",
        "bio": "Software Craftsman",
        "gender": "male"
    }
    put_response = api_client.put(profile_url, update_payload)
    assert put_response.status_code == status.HTTP_200_OK
    rendered_put = json.loads(put_response.content)
    assert rendered_put['success'] is True
    assert rendered_put['message'] == "Profile updated successfully."
    assert rendered_put['data']['user']['first_name'] == "UpdatedName"
    assert rendered_put['data']['user']['bio'] == "Software Craftsman"
    assert rendered_put['data']['user']['gender'] == "male"
    
    # Verify User profile records in DB
    test_user.refresh_from_db()
    assert test_user.first_name == "UpdatedName"
    assert test_user.profile.bio == "Software Craftsman"
    assert AuditLog.objects.filter(user=test_user, action="User Profile Updated").exists()


@pytest.mark.django_db
def test_change_password(api_client, test_user):
    """
    Verify authenticated password change functionality.
    """
    change_url = reverse('auth_change_password')
    
    # Login to authenticate api client
    login_url = reverse('auth_login')
    login_response = api_client.post(login_url, {
        "email": test_user.email,
        "password": "Testpassword123!"
    })
    rendered_login = json.loads(login_response.content)
    access_token = rendered_login['data']['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # 1. Mismatch change attempt
    payload = {
        "old_password": "Testpassword123!",
        "new_password": "NewStrongPass123!",
        "confirm_password": "WrongMismatchConfirm"
    }
    response = api_client.post(change_url, payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    # 2. Correct change attempt
    payload["confirm_password"] = "NewStrongPass123!"
    response = api_client.post(change_url, payload)
    assert response.status_code == status.HTTP_200_OK
    rendered_change = json.loads(response.content)
    assert rendered_change['success'] is True
    assert rendered_change['message'] == "Password updated successfully."
    
    # Verify AuditLog
    assert AuditLog.objects.filter(user=test_user, action="Password Changed via Profile settings").exists()
    
    # Verify new password logins succeed
    api_client.credentials() # Clear headers
    login_payload = {
        "email": test_user.email,
        "password": "NewStrongPass123!"
    }
    response = api_client.post(login_url, login_payload)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_forgot_and_reset_password(api_client, test_user):
    """
    Verify secure forgot password reset token caching and reset submission.
    """
    forgot_url = reverse('auth_forgot_password')
    reset_url = reverse('auth_reset_password')
    
    # 1. Send forgot password request
    response = api_client.post(forgot_url, {"email": test_user.email})
    assert response.status_code == status.HTTP_200_OK
    rendered_forgot = json.loads(response.content)
    assert rendered_forgot['success'] is True
    
    # Verify token saved in cache
    cached_token = cache.get(f"password_reset_{test_user.email}")
    assert cached_token is not None
    assert AuditLog.objects.filter(user=test_user, action="Password Reset Token Requested").exists()
    
    # 2. Confirm reset using the token
    reset_payload = {
        "email": test_user.email,
        "token": cached_token,
        "new_password": "RecoveredPassWord123!",
        "confirm_password": "RecoveredPassWord123!"
    }
    reset_response = api_client.post(reset_url, reset_payload)
    assert reset_response.status_code == status.HTTP_200_OK
    rendered_reset = json.loads(reset_response.content)
    assert rendered_reset['success'] is True
    assert rendered_reset['message'] == "Password reset completed successfully."
    
    # Verify cache token deleted
    assert cache.get(f"password_reset_{test_user.email}") is None
    assert AuditLog.objects.filter(user=test_user, action="Password Reset Confirmed").exists()


@pytest.mark.django_db
def test_rbac_admin_user_crud_restrictions(api_client, test_user, admin_user):
    """
    Verify administrative user list/CRUD permissions restrict standard users and allow admins.
    """
    crud_url = reverse('user-list')
    
    # 1. Accessing CRUD list as Customer should return 403 Forbidden
    login_url = reverse('auth_login')
    customer_login = api_client.post(login_url, {
        "email": test_user.email,
        "password": "Testpassword123!"
    })
    rendered_cust = json.loads(customer_login.content)
    customer_access = rendered_cust['data']['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {customer_access}')
    
    customer_response = api_client.get(crud_url)
    assert customer_response.status_code == status.HTTP_403_FORBIDDEN
    
    # 2. Accessing CRUD list as Admin should return 200 OK
    api_client.credentials() # Reset credentials
    admin_login = api_client.post(login_url, {
        "email": admin_user.email,
        "password": "Adminpassword123!"
    })
    rendered_adm = json.loads(admin_login.content)
    admin_access = rendered_adm['data']['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_access}')
    
    admin_response = api_client.get(crud_url)
    assert admin_response.status_code == status.HTTP_200_OK
    rendered_list = json.loads(admin_response.content)
    assert len(rendered_list['data']) >= 2 # Should contain test_user and admin_user
