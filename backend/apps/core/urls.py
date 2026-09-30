from django.urls import path
from .views import health_check, database_health_check

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('health/database/', database_health_check, name='database_health_check'),
]
