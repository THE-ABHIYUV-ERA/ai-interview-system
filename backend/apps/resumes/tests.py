from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
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

class ResumeAPITests(APITestCase):
    def setUp(self):
        self.candidate_a = User.objects.create_user(email='a@example.com', password='password123')
        self.candidate_b = User.objects.create_user(email='b@example.com', password='password123')
        
        self.resume_a = Resume.objects.create(candidate=self.candidate_a, original_filename='a.pdf')
        self.resume_b = Resume.objects.create(candidate=self.candidate_b, original_filename='b.pdf')
        
        self.list_url = '/api/resumes/'
        
    def test_unauthenticated_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_unauthenticated_detail(self):
        url = f'/api/resumes/{self.resume_a.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_ownership_list_isolation(self):
        self.client.force_authenticate(user=self.candidate_a)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.resume_a.id)
        
        self.client.force_authenticate(user=self.candidate_b)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.resume_b.id)
        
    def test_ownership_detail_isolation(self):
        self.client.force_authenticate(user=self.candidate_a)
        
        # Can get own
        response = self.client.get(f'/api/resumes/{self.resume_a.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Cannot get other's
        response = self.client.get(f'/api/resumes/{self.resume_b.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_update_allowed_fields(self):
        self.client.force_authenticate(user=self.candidate_a)
        url = f'/api/resumes/{self.resume_a.id}/'
        
        data = {
            'parsed_data': {'name': 'Updated A'},
            'status': 'completed', # Should be ignored
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.resume_a.refresh_from_db()
        self.assertEqual(self.resume_a.parsed_data, {'name': 'Updated A'})
        self.assertEqual(self.resume_a.status, 'uploaded') # Unchanged
        
    def test_update_invalid_parsed_data(self):
        self.client.force_authenticate(user=self.candidate_a)
        url = f'/api/resumes/{self.resume_a.id}/'
        
        data = {'parsed_data': 'hello'} # Invalid, should be dict
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_update_other_resume(self):
        self.client.force_authenticate(user=self.candidate_a)
        url = f'/api/resumes/{self.resume_b.id}/'
        
        data = {'parsed_data': {'name': 'Hacked'}}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_delete_own_resume(self):
        self.client.force_authenticate(user=self.candidate_a)
        url = f'/api/resumes/{self.resume_a.id}/'
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Resume.objects.filter(id=self.resume_a.id).exists())
        
    def test_delete_other_resume(self):
        self.client.force_authenticate(user=self.candidate_a)
        url = f'/api/resumes/{self.resume_b.id}/'
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Resume.objects.filter(id=self.resume_b.id).exists())
        
    def test_empty_list(self):
        candidate_c = User.objects.create_user(email='c@example.com', password='password123')
        self.client.force_authenticate(user=candidate_c)
        
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_upload_resume(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.candidate_a)
        
        pdf_content = b'%PDF-1.4\n%...\n'
        file = SimpleUploadedFile("test_upload.pdf", pdf_content, content_type="application/pdf")
        
        response = self.client.post('/api/resumes/upload/', {'file': file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['original_filename'], 'test_upload.pdf')
        self.assertEqual(response.data['status'], 'uploaded')
        
        resume = Resume.objects.get(id=response.data['id'])
        self.assertEqual(resume.candidate, self.candidate_a)
        
    def test_upload_invalid_file_type(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.candidate_a)
        
        file = SimpleUploadedFile("test.txt", b'hello world', content_type="text/plain")
        response = self.client.post('/api/resumes/upload/', {'file': file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only PDF resume files", response.data['error'])
        
    def test_upload_invalid_signature(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.candidate_a)
        
        file = SimpleUploadedFile("test.pdf", b'hello world', content_type="application/pdf")
        response = self.client.post('/api/resumes/upload/', {'file': file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only PDF resume files", response.data['error'])
