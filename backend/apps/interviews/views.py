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
            return Response({"detail": "This answer has already been submitted."}, status=status.HTTP_409_CONFLICT)

        serializer = InterviewAnswerSerializer(data=request.data)
        if serializer.is_valid():
            try:
                from django.db import IntegrityError, transaction
                with transaction.atomic():
                    # Check again inside transaction to prevent race conditions
                    if hasattr(question, 'answer'):
                        return Response({"detail": "This answer has already been submitted."}, status=status.HTTP_409_CONFLICT)
                        
                    # Calculate duration safely if start time is provided, or rely on client if bounded
                    duration = serializer.validated_data.get('duration_seconds', 0)
                    if duration < 0 or duration > 3600:
                        duration = 0 # Fallback for invalid client input
                    
                    answer = serializer.save(
                        question=question, 
                        submitted_at=timezone.now(),
                        duration_seconds=duration
                    )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({"detail": "This answer has already been submitted."}, status=status.HTTP_409_CONFLICT)
            except Exception as e:
                return Response({"detail": "Something went wrong while saving your answer."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, interview_id, question_id):
        # We can disable modification of submitted answers as per spec:
        # "prevent editing the submitted answer"
        return Response({"detail": "Editing submitted answers is not permitted."}, status=status.HTTP_403_FORBIDDEN)

from .serializers import InterviewAnswerEvaluationSerializer
from apps.ai_services.answer_evaluator import evaluate_answer, EvaluationError

class InterviewAnswerEvaluateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, interview_id, question_id):
        # Validate ownership and relationships
        question = get_object_or_404(
            InterviewQuestion,
            id=question_id,
            interview_id=interview_id,
            interview__candidate=request.user
        )
        
        if not hasattr(question, 'answer'):
            return Response({"detail": "Answer not found."}, status=status.HTTP_404_NOT_FOUND)
            
        answer = question.answer
        
        if hasattr(answer, 'evaluation'):
            evaluation = answer.evaluation
            if evaluation.status == 'processing':
                return Response({"detail": "Evaluation is already processing."}, status=status.HTTP_400_BAD_REQUEST)
            if evaluation.status == 'completed':
                serializer = InterviewAnswerEvaluationSerializer(evaluation)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        try:
            evaluation = evaluate_answer(answer)
            serializer = InterviewAnswerEvaluationSerializer(evaluation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except EvaluationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"detail": "An unexpected error occurred during evaluation."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
