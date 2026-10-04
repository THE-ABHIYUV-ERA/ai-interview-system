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

    GENERATION_STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews')
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True, related_name='interviews')
    job_role = models.CharField(max_length=255)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES)
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPE_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    duration_minutes = models.IntegerField(default=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    question_generation_status = models.CharField(max_length=20, choices=GENERATION_STATUS_CHOICES, default='not_started')
    question_generation_error = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job_role} Interview - {self.candidate.email}"

class InterviewQuestion(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('situational', 'Situational'),
        ('project', 'Project'),
        ('resume', 'Resume'),
        ('general', 'General'),
    ]

    SOURCE_CHOICES = [
        ('system', 'System'),
        ('ai', 'AI'),
        ('manual', 'Manual'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    interview = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name='questions')
    sequence_number = models.PositiveIntegerField()
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='general')
    category = models.CharField(max_length=100, blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    expected_duration_seconds = models.PositiveIntegerField(default=120)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='system')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sequence_number']
        unique_together = [['interview', 'sequence_number']]

    def __str__(self):
        return f"Question {self.sequence_number} for {self.interview}"

class InterviewAnswer(models.Model):
    question = models.OneToOneField(InterviewQuestion, on_delete=models.CASCADE, related_name='answer')
    answer_text = models.TextField(max_length=20000)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Answer to {self.question}"

class InterviewAnswerEvaluation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    answer = models.OneToOneField(InterviewAnswer, on_delete=models.CASCADE, related_name='evaluation')
    summary = models.TextField(blank=True)
    structured_data = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Evaluation for {self.answer}"
