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
            'question_generation_status', 'question_generation_error',
            'created_at', 'updated_at', 'started_at', 'completed_at',
            'question_count', 'answered_count'
        ]
        read_only_fields = [
            'id', 'candidate', 'status', 'question_generation_status', 
            'question_generation_error', 'created_at', 'updated_at', 
            'started_at', 'completed_at', 'question_count', 'answered_count'
        ]

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
    answer_text = serializers.SerializerMethodField()
    evaluation = serializers.SerializerMethodField()

    class Meta:
        model = InterviewQuestion
        fields = [
            'id', 'sequence_number', 'question_text', 'question_type', 
            'category', 'difficulty', 'expected_duration_seconds', 
            'source', 'created_at', 'has_answer', 'answer_text', 'evaluation'
        ]
        read_only_fields = fields

    def get_has_answer(self, obj):
        return hasattr(obj, 'answer')
        
    def get_answer_text(self, obj):
        if hasattr(obj, 'answer'):
            return obj.answer.answer_text
        return None
        
    def get_evaluation(self, obj):
        if hasattr(obj, 'answer') and hasattr(obj.answer, 'evaluation'):
            # Fetch structured data
            return {
                'status': obj.answer.evaluation.status,
                'summary': obj.answer.evaluation.summary,
                'structured_data': obj.answer.evaluation.structured_data,
            }
        return None


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

from .models import InterviewAnswerEvaluation

class InterviewAnswerEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewAnswerEvaluation
        fields = [
            'id', 'answer', 'summary', 'structured_data', 'status', 
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

from .models import InterviewReport

class InterviewReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewReport
        fields = [
            'id', 'interview', 'status', 'report_data', 
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = fields
