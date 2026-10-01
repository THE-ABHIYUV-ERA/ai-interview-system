from rest_framework import viewsets, permissions
from .models import Resume
from .serializers import ResumeSerializer
from .permissions import IsOwner

class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Resume.objects.all()
        return Resume.objects.filter(candidate=user)
