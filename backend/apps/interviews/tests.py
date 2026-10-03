from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.resumes.models import Resume

User = get_user_model()

class InterviewSessionTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email='test1@example.com', password='password123', name='User One')
        self.user2 = User.objects.create_user(email='test2@example.com', password='password123', name='User Two')
        
        self.resume1 = Resume.objects.create(
            candidate=self.user1,
            original_filename='resume1.pdf',
            status='completed'
        )
        self.resume2 = Resume.objects.create(
            candidate=self.user2,
            original_filename='resume2.pdf',
            status='completed'
        )

    def test_create_interview_session(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume1.id,
            'job_role': 'Frontend Developer',
            'experience_level': 'mid',
            'interview_type': 'technical',
            'difficulty': 'medium',
            'duration_minutes': 45
        }
        response = self.client.post('/api/interviews/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'draft')
        self.assertEqual(response.data['candidate'], self.user1.id)

    def test_cannot_use_others_resume(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume2.id,
            'job_role': 'Frontend Developer',
            'experience_level': 'mid',
            'interview_type': 'technical',
            'difficulty': 'medium',
            'duration_minutes': 45
        }
        response = self.client.post('/api/interviews/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('resume', response.data)

    def test_start_interview_valid(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume1.id,
            'job_role': 'Frontend Developer',
            'experience_level': 'mid',
            'interview_type': 'technical',
            'difficulty': 'medium',
            'duration_minutes': 45
        }
        create_res = self.client.post('/api/interviews/', data)
        interview_id = create_res.data['id']

        start_res = self.client.post(f'/api/interviews/{interview_id}/start/')
        self.assertEqual(start_res.status_code, status.HTTP_200_OK)
        self.assertEqual(start_res.data['status'], 'in_progress')
        self.assertIsNotNone(start_res.data['started_at'])

    def test_cannot_start_completed_interview(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume1.id,
            'job_role': 'Frontend Developer',
            'experience_level': 'mid',
            'interview_type': 'technical',
            'difficulty': 'medium',
            'duration_minutes': 45
        }
        create_res = self.client.post('/api/interviews/', data)
        interview_id = create_res.data['id']
        
        # Start it
        self.client.post(f'/api/interviews/{interview_id}/start/')
        
        # Try to start again
        start_res = self.client.post(f'/api/interviews/{interview_id}/start/')
        self.assertEqual(start_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duration_validation(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume1.id,
            'job_role': 'Frontend Developer',
            'experience_level': 'mid',
            'interview_type': 'technical',
            'difficulty': 'medium',
            'duration_minutes': 5 # Invalid duration
        }
        response = self.client.post('/api/interviews/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_and_fetch_questions(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume1.id,
            'job_role': 'Frontend Developer',
            'experience_level': 'mid',
            'interview_type': 'technical',
            'difficulty': 'medium',
            'duration_minutes': 45
        }
        create_res = self.client.post('/api/interviews/', data)
        interview_id = create_res.data['id']
        
        # Test creating question directly via model since there's no endpoint
        from apps.interviews.models import InterviewQuestion
        InterviewQuestion.objects.create(interview_id=interview_id, sequence_number=1, question_text='Q1')
        InterviewQuestion.objects.create(interview_id=interview_id, sequence_number=2, question_text='Q2')
        
        # Fetch questions
        questions_res = self.client.get(f'/api/interviews/{interview_id}/questions/')
        self.assertEqual(questions_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(questions_res.data), 2)
        self.assertEqual(questions_res.data[0]['sequence_number'], 1)

    def test_submit_answer(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume1.id,
            'job_role': 'Dev',
            'experience_level': 'fresher',
            'interview_type': 'technical',
            'difficulty': 'easy',
            'duration_minutes': 30
        }
        create_res = self.client.post('/api/interviews/', data)
        interview_id = create_res.data['id']
        
        from apps.interviews.models import InterviewQuestion
        q = InterviewQuestion.objects.create(interview_id=interview_id, sequence_number=1, question_text='Q1')
        
        # Start interview so we can submit answers
        self.client.post(f'/api/interviews/{interview_id}/start/')
        
        # Submit answer
        answer_data = {'answer_text': 'My Answer'}
        ans_res = self.client.post(f'/api/interviews/{interview_id}/questions/{q.id}/answer/', answer_data)
        self.assertEqual(ans_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ans_res.data['answer_text'], 'My Answer')
        
        # Prevent duplicate submission
        ans_res2 = self.client.post(f'/api/interviews/{interview_id}/questions/{q.id}/answer/', answer_data)
        self.assertEqual(ans_res2.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Update answer
        patch_data = {'answer_text': 'Updated Answer'}
        patch_res = self.client.patch(f'/api/interviews/{interview_id}/questions/{q.id}/answer/', patch_data)
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['answer_text'], 'Updated Answer')

