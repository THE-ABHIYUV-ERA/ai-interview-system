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

from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import InterviewQuestion, InterviewAnswer
from .serializers import InterviewQuestionSerializer, InterviewAnswerSerializer

class InterviewQuestionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, interview_id):
        interview = get_object_or_404(InterviewSession, id=interview_id, candidate=request.user)
        questions = interview.questions.all().order_by('sequence_number')
        serializer = InterviewQuestionSerializer(questions, many=True)
        return Response(serializer.data)

class InterviewAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_question(self, request, interview_id, question_id):
        return get_object_or_404(
            InterviewQuestion,
            id=question_id,
            interview_id=interview_id,
            interview__candidate=request.user
        )

    def get(self, request, interview_id, question_id):
        question = self.get_question(request, interview_id, question_id)
        if not hasattr(question, 'answer'):
            return Response({"detail": "No answer found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = InterviewAnswerSerializer(question.answer)
        return Response(serializer.data)

    def post(self, request, interview_id, question_id):
        question = self.get_question(request, interview_id, question_id)
        if question.interview.status != 'in_progress':
            return Response({"detail": "Can only submit answers when interview is in progress."}, status=status.HTTP_400_BAD_REQUEST)
        
        if hasattr(question, 'answer'):
            return Response({"detail": "Answer already exists. Use PATCH to update."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InterviewAnswerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(question=question)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, interview_id, question_id):
        question = self.get_question(request, interview_id, question_id)
        if question.interview.status != 'in_progress':
            return Response({"detail": "Can only update answers when interview is in progress."}, status=status.HTTP_400_BAD_REQUEST)

        if not hasattr(question, 'answer'):
            return Response({"detail": "No answer exists to update. Use POST first."}, status=status.HTTP_404_NOT_FOUND)

        serializer = InterviewAnswerSerializer(question.answer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
