from django.urls import path
from .views import (
    RegisterView, 
    CustomTokenObtainPairView, 
    CustomTokenRefreshView, 
    LogoutView, 
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
    UserProfileView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='auth_token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('profile/', UserProfileView.as_view(), name='auth_profile'),
]
