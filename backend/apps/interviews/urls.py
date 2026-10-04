from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InterviewSessionViewSet, 
    InterviewQuestionListView, 
    InterviewAnswerView, 
    InterviewAnswerEvaluateView,
    InterviewCompleteView,
    InterviewReportView
)

router = DefaultRouter()
router.register(r'', InterviewSessionViewSet, basename='interview')

urlpatterns = [
    path('<int:interview_id>/complete/', InterviewCompleteView.as_view(), name='interview-complete'),
    path('<int:interview_id>/report/', InterviewReportView.as_view(), name='interview-report'),
    path('<int:interview_id>/questions/', InterviewQuestionListView.as_view(), name='interview-questions'),
    path('<int:interview_id>/questions/<int:question_id>/answer/', InterviewAnswerView.as_view(), name='interview-answer'),
    path('<int:interview_id>/questions/<int:question_id>/answer/evaluate/', InterviewAnswerEvaluateView.as_view(), name='interview-answer-evaluate'),
    path('', include(router.urls)),
]
