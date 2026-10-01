from django.contrib import admin
from .models import Resume

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'original_filename', 'status', 'uploaded_at')
    list_filter = ('status',)
