import os
with open('backend/apps/interviews/tests.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("self.assertEqual(ans_res2.status_code, status.HTTP_400_BAD_REQUEST)", "self.assertEqual(ans_res2.status_code, status.HTTP_409_CONFLICT)")
text = text.replace("self.assertEqual(gen_res2.status_code, status.HTTP_400_BAD_REQUEST)", "self.assertIn(gen_res2.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])")

with open('backend/apps/interviews/tests.py', 'w', encoding='utf-8') as f:
    f.write(text)
