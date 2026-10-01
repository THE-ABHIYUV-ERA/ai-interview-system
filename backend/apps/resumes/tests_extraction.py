import os
import tempfile
import fitz
from django.test import TestCase
from .services import extract_text_from_pdf, normalize_text, ResumePDFExtractionError, ResumePDFPageLimitError

class PDFExtractionServiceTest(TestCase):
    def setUp(self):
        # Create a temporary directory to store test PDFs
        self.temp_dir = tempfile.TemporaryDirectory()
        
    def tearDown(self):
        self.temp_dir.cleanup()
        
    def create_pdf(self, filename, text, pages=1):
        path = os.path.join(self.temp_dir.name, filename)
        doc = fitz.open()
        for i in range(pages):
            page = doc.new_page()
            page.insert_text((50, 50), text)
        doc.save(path)
        doc.close()
        return path

    def create_corrupted_pdf(self, filename):
        path = os.path.join(self.temp_dir.name, filename)
        with open(path, 'wb') as f:
            f.write(b"NOT A REAL PDF FILE CONTENT")
        return path
        
    def test_normalize_text(self):
        raw_text = "John Doe \t\n\n\n\nSkills:    React.js, C++\r\n\nExperience:\n\nDeveloper"
        expected = "John Doe\n\nSkills: React.js, C++\n\nExperience:\n\nDeveloper"
        self.assertEqual(normalize_text(raw_text), expected)
        
    def test_extract_one_page(self):
        text = "John Doe\nSkills: Python, Django, React, Next.js, PostgreSQL\nExperience: Software Developer"
        pdf_path = self.create_pdf("one_page.pdf", text)
        extracted = extract_text_from_pdf(pdf_path)
        self.assertIn("John Doe", extracted)
        self.assertIn("Python, Django, React, Next.js", extracted)
        
    def test_extract_multi_page(self):
        text = "Page content"
        pdf_path = self.create_pdf("multi_page.pdf", text, pages=3)
        extracted = extract_text_from_pdf(pdf_path)
        self.assertEqual(extracted.count("Page content"), 3)
        
    def test_empty_pdf(self):
        # Creating a PDF with empty text
        pdf_path = self.create_pdf("empty.pdf", "   \n  ")
        with self.assertRaisesMessage(ResumePDFExtractionError, "Unable to extract readable text"):
            extract_text_from_pdf(pdf_path)
            
    def test_corrupted_pdf(self):
        pdf_path = self.create_corrupted_pdf("corrupt.pdf")
        with self.assertRaises(ResumePDFExtractionError):
            extract_text_from_pdf(pdf_path)
            
    def test_missing_file(self):
        with self.assertRaises(FileNotFoundError):
            extract_text_from_pdf("does_not_exist.pdf")
            
    def test_page_limit(self):
        pdf_path = self.create_pdf("too_long.pdf", "Content", pages=12)
        with self.assertRaisesMessage(ResumePDFPageLimitError, "maximum allowed page count"):
            extract_text_from_pdf(pdf_path, max_pages=10)
