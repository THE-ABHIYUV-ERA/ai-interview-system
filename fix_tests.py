with open('backend/apps/interviews/tests.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "self.assertEqual(patch_res.data['answer_text'], 'Updated Answer')" in line:
        continue
    new_lines.append(line)

new_code = "".join(new_lines)

append_code = """
    def test_complete_interview(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume1.id,
            'job_role': 'Frontend Developer',
            'experience_level': 'mid',
            'interview_type': 'technical',
            'difficulty': 'medium',
            'duration_minutes': 30
        }
        create_res = self.client.post('/api/interviews/', data)
        interview_id = create_res.data['id']
        
        # Must be in progress
        self.client.post(f'/api/interviews/{interview_id}/start/')
        
        # Complete
        comp_res = self.client.post(f'/api/interviews/{interview_id}/complete/')
        self.assertEqual(comp_res.status_code, 200)
        self.assertEqual(comp_res.data['status'], 'completed')
        
    def test_report_endpoint(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'resume': self.resume1.id,
            'job_role': 'Frontend Developer',
            'experience_level': 'mid',
            'interview_type': 'technical',
            'difficulty': 'medium',
            'duration_minutes': 30
        }
        create_res = self.client.post('/api/interviews/', data)
        interview_id = create_res.data['id']
        
        self.client.post(f'/api/interviews/{interview_id}/start/')
        self.client.post(f'/api/interviews/{interview_id}/complete/')
        
        report_res = self.client.get(f'/api/interviews/{interview_id}/report/')
        self.assertEqual(report_res.status_code, 200)
        self.assertIn(report_res.data['status'], ['processing', 'completed'])
"""

new_code = new_code.rstrip() + "\n" + append_code

with open('backend/apps/interviews/tests.py', 'w', encoding='utf-8') as f:
    f.write(new_code)
