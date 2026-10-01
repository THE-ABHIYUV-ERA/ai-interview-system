from rest_framework import serializers
from .models import Resume

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = (
            'id', 'original_filename', 'file_size', 'mime_type',
            'extracted_text', 'parsed_data', 'status', 'error_message',
            'uploaded_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'original_filename', 'file_size', 'mime_type',
            'extracted_text', 'status', 'error_message',
            'uploaded_at', 'updated_at'
        )
    
    def validate_parsed_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("parsed_data must be a dictionary/object.")
        return value
