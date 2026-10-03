from django.contrib import admin
from .models import InterviewSession, InterviewQuestion, InterviewAnswer

@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'job_role', 'status', 'created_at')

@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'interview', 'sequence_number', 'question_type', 'difficulty')

@admin.register(InterviewAnswer)
class InterviewAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'submitted_at')
