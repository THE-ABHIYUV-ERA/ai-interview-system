from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InterviewSessionViewSet, InterviewQuestionListView, InterviewAnswerView

router = DefaultRouter()
router.register(r'', InterviewSessionViewSet, basename='interview')

urlpatterns = [
    path('<int:interview_id>/questions/', InterviewQuestionListView.as_view(), name='interview-questions'),
    path('<int:interview_id>/questions/<int:question_id>/answer/', InterviewAnswerView.as_view(), name='interview-answer'),
    path('', include(router.urls)),
]
