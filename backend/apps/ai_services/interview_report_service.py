import os
import json
import logging
from typing import Dict, Any
from apps.interviews.models import InterviewSession, InterviewReport

logger = logging.getLogger(__name__)

REPORT_SYSTEM_PROMPT = """
You are an expert AI interview evaluator providing a final practice report for a candidate.
Your goal is to aggregate the feedback from the individual answers into a coherent final summary.

IMPORTANT CONSTRAINTS:
1. This is PRACTICE FEEDBACK only.
2. DO NOT make hiring decisions, recommend hire/reject, rank candidates, or provide employability scores.
3. DO NOT produce any numerical hiring score (e.g. 8/10).
4. DO NOT evaluate or infer protected characteristics.
5. Base your insights ONLY on the provided evaluations and resume.

Respond ONLY with a valid JSON object matching this schema exactly:
{
  "summary": "Short 2-3 sentence overall summary.",
  "strengths": ["string", "string"],
  "improvement_areas": ["string", "string"],
  "communication_feedback": "Overall communication feedback.",
  "technical_feedback": "Overall technical/domain feedback.",
  "recommended_practice": ["string", "string"]
}
"""

class ReportGenerationError(Exception):
    pass

def generate_interview_report(interview: InterviewSession) -> InterviewReport:
    report, created = InterviewReport.objects.get_or_create(
        interview=interview,
        defaults={'status': 'processing'}
    )

    if not created and report.status == 'completed':
        return report

    report.status = 'processing'
    report.error_message = ''
    report.save()

    try:
        # Gather data
        questions = interview.questions.all().order_by('sequence_number')
        total_questions = questions.count()
        
        answered_questions = []
        unanswered_count = 0
        
        for q in questions:
            if hasattr(q, 'answer'):
                eval_data = None
                if hasattr(q.answer, 'evaluation') and q.answer.evaluation.status == 'completed':
                    eval_data = q.answer.evaluation.structured_data
                
                answered_questions.append({
                    "question_type": q.question_type,
                    "question_text": q.question_text,
                    "answer_text": q.answer.answer_text,
                    "evaluation": eval_data
                })
            else:
                unanswered_count += 1
                
        answered_count = len(answered_questions)
        
        # Calculate question_type_insights based on existing evaluations
        type_insights_dict = {}
        for ans in answered_questions:
            qtype = ans["question_type"]
            if qtype not in type_insights_dict:
                type_insights_dict[qtype] = {"answered": 0, "feedback": []}
                
            type_insights_dict[qtype]["answered"] += 1
            if ans["evaluation"] and "summary" in ans["evaluation"]:
                type_insights_dict[qtype]["feedback"].append(ans["evaluation"]["summary"])
                
        question_type_insights = []
        for qtype, data in type_insights_dict.items():
            feedback_str = " ".join(data["feedback"]) if data["feedback"] else "No specific feedback available."
            question_type_insights.append({
                "type": qtype,
                "answered": data["answered"],
                "feedback": feedback_str[:200] + "..." if len(feedback_str) > 200 else feedback_str
            })

        # LLM aggregation for the high-level summary
        api_key = os.environ.get('AI_API_KEY')
        model_name = os.environ.get('AI_MODEL', 'gemini-1.5-pro')

        llm_json = {}
        if not api_key:
            logger.warning("AI_API_KEY is not set. Generating mocked report.")
            llm_json = {
                "summary": "This is a mock final report since AI is disabled.",
                "strengths": ["Clear communication", "Good foundational knowledge"],
                "improvement_areas": ["More detailed examples", "Deeper technical explanations"],
                "communication_feedback": "Candidate communicated clearly.",
                "technical_feedback": "Candidate showed acceptable technical knowledge.",
                "recommended_practice": ["Practice more behavioral questions"]
            }
        else:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={"temperature": 0.3, "response_mime_type": "application/json"}
            )
            
            prompt_context = json.dumps({
                "job_role": interview.job_role,
                "experience_level": interview.experience_level,
                "answered_questions": answered_questions
            }, default=str)
            
            full_prompt = REPORT_SYSTEM_PROMPT + "\n\nInterview Data:\n" + prompt_context
            
            response = model.generate_content(full_prompt)
            if not response.text:
                raise ReportGenerationError("Empty response from AI provider.")
                
            try:
                llm_json = json.loads(response.text)
            except json.JSONDecodeError:
                raise ReportGenerationError("AI provider returned invalid JSON.")

        # Combine into final report structure
        final_report_data = {
            "summary": llm_json.get("summary", "Report generated."),
            "questions_answered": answered_count,
            "questions_total": total_questions,
            "answer_coverage": {
                "answered": answered_count,
                "unanswered": unanswered_count
            },
            "strengths": llm_json.get("strengths", []),
            "improvement_areas": llm_json.get("improvement_areas", []),
            "question_type_insights": question_type_insights,
            "communication_feedback": llm_json.get("communication_feedback", ""),
            "technical_feedback": llm_json.get("technical_feedback", ""),
            "recommended_practice": llm_json.get("recommended_practice", [])
        }
        
        report.report_data = final_report_data
        report.status = 'completed'
        report.save()
        return report

    except Exception as e:
        logger.error(f"Failed to generate report for interview {interview.id}: {str(e)}")
        report.status = 'failed'
        report.error_message = str(e)
        report.save()
        raise ReportGenerationError(report.error_message)
