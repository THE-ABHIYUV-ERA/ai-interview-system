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

    @action(detail=True, methods=['post'], url_path='generate-questions')
    def generate_questions(self, request, pk=None):
        interview = self.get_object()
        
        if interview.status not in ['draft', 'ready']:
            return Response(
                {"error": "Questions can only be generated when the interview is in draft or ready state."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if interview.question_generation_status == 'processing':
            return Response(
                {"error": "Question generation is already in progress."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        interview.question_generation_status = 'processing'
        interview.save()
        
        from apps.ai_services.question_generator import generate_questions_for_interview, QuestionGenerationError
        
        try:
            generated_questions = generate_questions_for_interview(interview)
            interview.question_generation_status = 'completed'
            interview.status = 'ready'
            interview.save()
            return Response({
                "interview_id": interview.id,
                "generation_status": "completed",
                "question_count": len(generated_questions),
                "message": "Questions generated successfully."
            }, status=status.HTTP_200_OK)
            
        except QuestionGenerationError as e:
            interview.question_generation_status = 'failed'
            interview.question_generation_error = str(e)
            interview.save()
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            interview.question_generation_status = 'failed'
            interview.question_generation_error = "An unexpected error occurred."
            interview.save()
            return Response({
                "error": "An unexpected error occurred during generation."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='next-question')
    def next_question(self, request, pk=None):
        interview = self.get_object()
        
        if interview.status != 'in_progress':
            return Response(
                {"error": "Interview is not in progress."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        from apps.ai_services.adaptive_question_engine import get_or_generate_next_question, AdaptiveQuestionError, QuestionLimitReached
        from .serializers import InterviewQuestionSerializer
        
        try:
            question, total_count = get_or_generate_next_question(interview)
            
            serializer = InterviewQuestionSerializer(question)
            
            return Response({
                "status": "success",
                "question": serializer.data,
                "progress": {
                    "current": question.sequence_number,
                    "total": total_count,
                    "answered": interview.questions.filter(answer__isnull=False).count()
                }
            }, status=status.HTTP_200_OK)
            
        except QuestionLimitReached as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except AdaptiveQuestionError as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({
                "error": "An unexpected error occurred while getting the next question."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
