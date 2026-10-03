from rest_framework import serializers
from .models import InterviewSession, InterviewQuestion, InterviewAnswer

class InterviewSessionSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    answered_count = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSession
        fields = [
            'id', 'candidate', 'resume', 'job_role', 'experience_level',
            'interview_type', 'difficulty', 'duration_minutes', 'status',
            'created_at', 'updated_at', 'started_at', 'completed_at',
            'question_count', 'answered_count'
        ]
        read_only_fields = ['id', 'candidate', 'status', 'created_at', 'updated_at', 'started_at', 'completed_at', 'question_count', 'answered_count']

    def get_question_count(self, obj):
        return obj.questions.count()
        
    def get_answered_count(self, obj):
        return obj.questions.filter(answer__isnull=False).count()

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

class InterviewQuestionSerializer(serializers.ModelSerializer):
    has_answer = serializers.SerializerMethodField()

    class Meta:
        model = InterviewQuestion
        fields = [
            'id', 'sequence_number', 'question_text', 'question_type', 
            'category', 'difficulty', 'expected_duration_seconds', 
            'source', 'created_at', 'has_answer'
        ]
        read_only_fields = fields

    def get_has_answer(self, obj):
        return hasattr(obj, 'answer')


class InterviewAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewAnswer
        fields = [
            'id', 'question', 'answer_text', 'started_at', 
            'submitted_at', 'duration_seconds', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'question', 'created_at', 'updated_at']

    def validate_answer_text(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Answer text cannot be empty.")
        if len(cleaned) > 20000:
            raise serializers.ValidationError("Answer text is too long (maximum 20,000 characters).")
        return cleaned
