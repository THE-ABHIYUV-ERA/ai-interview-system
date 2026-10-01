from django.db import models
from django.conf import settings

class Resume(models.Model):
    STATUS_CHOICES = (
        ('uploaded', 'uploaded'),
        ('processing', 'processing'),
        ('completed', 'completed'),
        ('failed', 'failed'),
    )

    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resumes'
    )
    file = models.FileField(upload_to='resumes/%Y/%m/%d/')
    original_filename = models.CharField(max_length=255, blank=True, null=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    extracted_text = models.TextField(blank=True, null=True)
    parsed_data = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    error_message = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        filename = self.original_filename or "Unknown filename"
        return f"{self.candidate.email} - {filename}"
