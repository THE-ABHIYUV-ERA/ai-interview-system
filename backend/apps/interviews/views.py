from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import InterviewSession
from .serializers import InterviewSessionSerializer
from .permissions import IsCandidateOwner

class InterviewSessionViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsCandidateOwner]
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return InterviewSession.objects.all()
        return InterviewSession.objects.filter(candidate=user)

    def perform_create(self, serializer):
        serializer.save(candidate=self.request.user)
        
    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status not in ['draft', 'ready']:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Cannot update an interview that is not in draft or ready state."})
        serializer.save()

    def perform_destroy(self, instance):
        if instance.status in ['in_progress']:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cannot delete an interview that is in progress.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        interview = self.get_object()
        
        if interview.status not in ['draft', 'ready']:
            return Response(
                {"error": "Only draft or ready interviews can be started."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        interview.status = 'in_progress'
        interview.started_at = timezone.now()
        interview.save()
        
        serializer = self.get_serializer(interview)
        return Response(serializer.data, status=status.HTTP_200_OK)
