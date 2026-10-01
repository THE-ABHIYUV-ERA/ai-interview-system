import os
import re
import fitz  # PyMuPDF

class ResumePDFExtractionError(Exception):
    pass

class ResumePDFPageLimitError(Exception):
    pass

def normalize_text(text):
    """
    Normalizes whitespace while preserving necessary newlines.
    Removes carriage returns, excessive spaces, and multiple blank lines.
    """
    if not text:
        return ""
        
    text = text.replace('\r', '')
    
    # Replace multiple spaces/tabs with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Replace multiple newlines with maximum 2 newlines (one blank line)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()

def extract_text_from_pdf(file_path, max_pages=10):
    """
    Extracts and normalizes text from a PDF file.
    Raises exceptions on errors, empty pdf, or page limit exceeded.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at {file_path}")
        
    try:
        doc = fitz.open(file_path)
    except Exception as e:
        raise ResumePDFExtractionError("Unable to open or process PDF file.")
        
    try:
        num_pages = len(doc)
        if num_pages == 0:
            raise ResumePDFExtractionError("Unable to extract readable text from this PDF.")
            
        if num_pages > max_pages:
            raise ResumePDFPageLimitError("Resume exceeds the maximum allowed page count.")
            
        text_chunks = []
        for page_num in range(num_pages):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text:
                text_chunks.append(text)
                
        combined_text = "\n".join(text_chunks)
        clean_text = normalize_text(combined_text)
        
        if not clean_text:
            raise ResumePDFExtractionError("Unable to extract readable text from this PDF.")
            
        return clean_text
    finally:
        doc.close()
