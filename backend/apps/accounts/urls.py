from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    LogoutView,
    CurrentUserView,
    ProfileView,
    GoogleLogin,
    GithubLogin
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', CurrentUserView.as_view(), name='me'),
    path('auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('auth/github/', GithubLogin.as_view(), name='github_login'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
