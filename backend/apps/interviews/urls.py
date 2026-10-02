from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InterviewSessionViewSet

router = DefaultRouter()
router.register(r'', InterviewSessionViewSet, basename='interview')

urlpatterns = [
    path('', include(router.urls)),
]
