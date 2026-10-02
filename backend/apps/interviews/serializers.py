from rest_framework import serializers
from .models import InterviewSession

class InterviewSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSession
        fields = [
            'id', 'candidate', 'resume', 'job_role', 'experience_level',
            'interview_type', 'difficulty', 'duration_minutes', 'status',
            'created_at', 'updated_at', 'started_at', 'completed_at'
        ]
        read_only_fields = ['id', 'candidate', 'status', 'created_at', 'updated_at', 'started_at', 'completed_at']

    def validate_duration_minutes(self, value):
        if value < 15 or value > 120:
            raise serializers.ValidationError("Duration must be between 15 and 120 minutes.")
        return value

    def validate_resume(self, value):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and value:
            if value.candidate != request.user:
                raise serializers.ValidationError("You can only use your own resume.")
        return value
