from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Resume

User = get_user_model()

class ResumeModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(email='test@example.com', password='password123')
    
    def test_resume_creation(self):
        resume = Resume.objects.create(candidate=self.user)
        self.assertEqual(resume.candidate, self.user)
        self.assertEqual(resume.status, 'uploaded')
        self.assertEqual(resume.parsed_data, {})
    
    def test_str_representation(self):
        resume = Resume.objects.create(candidate=self.user, original_filename='test_resume.pdf')
        self.assertEqual(str(resume), 'test@example.com - test_resume.pdf')
