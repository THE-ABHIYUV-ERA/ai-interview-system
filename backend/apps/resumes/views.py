import uuid
import os
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Resume
from .serializers import ResumeSerializer
from .permissions import IsOwner
from .services import extract_text_from_pdf, ResumePDFExtractionError, ResumePDFPageLimitError

class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    http_method_names = ['get', 'patch', 'delete', 'post']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Resume.objects.all()
        return Resume.objects.filter(candidate=user)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > 5 * 1024 * 1024:
            return Response({'error': 'Resume file must be smaller than 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext != '.pdf' or file_obj.content_type != 'application/pdf':
            return Response({'error': 'Only PDF resume files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        file_obj.seek(0)
        signature = file_obj.read(4)
        file_obj.seek(0)

        if signature != b'%PDF':
            return Response({'error': 'Only PDF resume files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        original_filename = file_obj.name
        
        resume = Resume(
            candidate=request.user,
            file=file_obj,
            original_filename=original_filename,
            file_size=file_obj.size,
            mime_type=file_obj.content_type,
            status='processing',
            parsed_data={},
            extracted_text=''
        )
        resume.save()
        
        try:
            extracted_text = extract_text_from_pdf(resume.file.path)
            resume.extracted_text = extracted_text
            resume.status = 'completed'
            resume.error_message = ''
        except ResumePDFExtractionError as e:
            resume.status = 'failed'
            resume.error_message = str(e) or "Unable to extract readable text from this resume."
        except ResumePDFPageLimitError as e:
            resume.status = 'failed'
            resume.error_message = str(e)
        except Exception:
            resume.status = 'failed'
            resume.error_message = "An unexpected error occurred during PDF processing."
            
        resume.save()
        
        serializer = self.get_serializer(resume)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
