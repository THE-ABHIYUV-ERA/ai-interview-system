import os
import json
import logging

logger = logging.getLogger(__name__)

class ResumeAnalysisError(Exception):
    pass

def analyze_resume(resume_text, parsed_data=None):
    """
    Analyzes a resume using the configured AI provider.
    Expects structured JSON returned based on the provided schema.
    """
    api_key = os.environ.get('AI_API_KEY')
    model_name = os.environ.get('AI_MODEL', 'gemini-1.5-pro')
    
    if not api_key:
        # Mock response for testing or if no key is provided
        logger.warning("AI_API_KEY is not set. Returning mocked analysis.")
        return {
            "summary": "Mocked summary: An experienced professional.",
            "skills": ["Mocked Skill 1", "Mocked Skill 2"],
            "strengths": ["Mocked Strength"],
            "areas_to_improve": ["Mocked Area"],
            "experience_highlights": ["Mocked Experience"],
            "project_highlights": ["Mocked Project"],
            "suggested_focus_areas": ["Mocked Focus"]
        }
        
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        # Generation config to enforce JSON structure
        generation_config = {
            "temperature": 0.2,
            "response_mime_type": "application/json",
        }
        
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=generation_config
        )
        
        prompt = f"""
        You are an expert technical recruiter and resume analyzer.
        Your task is to analyze the following resume information and extract structured insights.
        
        IMPORTANT RULES:
        1. Use ONLY information present in the supplied resume.
        2. Do NOT fabricate experience, skills, or projects.
        3. Do NOT infer protected characteristics (age, gender, religion, etc.).
        4. Do NOT make hiring recommendations or assign employability scores.
        5. Do NOT rank the candidate.
        
        Output a valid JSON object matching exactly this structure:
        {{
            "summary": "Brief summary of the candidate's profile based on the resume.",
            "skills": ["List of key skills"],
            "strengths": ["List of 2-3 key strengths"],
            "areas_to_improve": ["List of 1-2 areas that could be improved in the resume"],
            "experience_highlights": ["List of 2-3 significant experience points"],
            "project_highlights": ["List of 1-2 significant project points"],
            "suggested_focus_areas": ["List of 2-3 areas an interviewer should focus on"]
        }}
        
        RESUME CONTENT:
        {resume_text}
        
        STRUCTURED DATA (if any):
        {json.dumps(parsed_data) if parsed_data else "None"}
        """
        
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ResumeAnalysisError("Empty response from AI provider.")
            
        analysis_result = json.loads(response.text)
        
        # Basic validation
        required_keys = ['summary', 'skills', 'strengths']
        for key in required_keys:
            if key not in analysis_result:
                 raise ResumeAnalysisError(f"Missing required key in AI response: {key}")
                 
        return analysis_result
        
    except json.JSONDecodeError:
        logger.error("AI provider returned invalid JSON.")
        raise ResumeAnalysisError("Resume analysis failed due to invalid response format.")
    except Exception as e:
        logger.error(f"AI provider error: {str(e)}")
        raise ResumeAnalysisError("Resume analysis is temporarily unavailable. Please try again.")
