from django.db import models
from django.contrib.auth import get_user_model
from apps.resumes.models import Resume

User = get_user_model()

class InterviewSession(models.Model):
    EXPERIENCE_LEVEL_CHOICES = [
        ('fresher', 'Fresher'),
        ('junior', 'Junior'),
        ('mid', 'Mid'),
        ('senior', 'Senior'),
    ]

    INTERVIEW_TYPE_CHOICES = [
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('mixed', 'Mixed'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('ready', 'Ready'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews')
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True, related_name='interviews')
    job_role = models.CharField(max_length=255)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES)
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPE_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    duration_minutes = models.IntegerField(default=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job_role} Interview - {self.candidate.email}"
