"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { InterviewQuestion } from "@/types/interview";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, AlertCircle, Info } from "lucide-react";

interface InterviewReviewProps {
  interviewId: number | string;
}

export default function InterviewReview({ interviewId }: InterviewReviewProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [evaluating, setEvaluating] = useState<number | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [interviewId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/interviews/${interviewId}/questions/`);
      setQuestions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load review data.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async (questionId: number) => {
    try {
      setEvaluating(questionId);
      const res = await api.post(`/interviews/${interviewId}/questions/${questionId}/answer/evaluate/`, {});
      
      // Update local state with evaluation
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          return { ...q, evaluation: res.data };
        }
        return q;
      }));
    } catch (err: any) {
      // Just fetch all to refresh state if error
      await fetchQuestions();
    } finally {
      setEvaluating(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-md flex gap-3 text-sm">
        <Info className="w-5 h-5 shrink-0" />
        <p>
          <strong>Disclaimer:</strong> AI feedback is for interview practice and may contain mistakes. 
          It does not evaluate your employability or rank you as a candidate.
        </p>
      </div>

      <h3 className="text-xl font-semibold mb-4">Interview Review</h3>
      
      {questions.map((q) => (
        <div key={q.id} className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
          <button 
            className="w-full text-left p-4 flex justify-between items-center bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">
                Question {q.sequence_number} • {q.question_type}
              </span>
              <p className="font-medium text-gray-900 dark:text-gray-100 pr-8">{q.question_text}</p>
            </div>
            {expandedId === q.id ? (
              <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
            )}
          </button>
          
          {expandedId === q.id && (
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Answer</h4>
                {q.answer_text ? (
                  <div className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {q.answer_text}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No answer submitted.</p>
                )}
              </div>
              
              {q.answer_text && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Feedback</h4>
                  
                  {!q.evaluation ? (
                    <Button 
                      variant="outline" 
                      onClick={() => evaluateAnswer(q.id)}
                      disabled={evaluating === q.id}
                    >
                      {evaluating === q.id ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating...</>
                      ) : "Generate Feedback"}
                    </Button>
                  ) : q.evaluation.status === "processing" ? (
                    <div className="flex items-center text-blue-600 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluation is processing...</span>
                    </div>
                  ) : q.evaluation.status === "failed" ? (
                    <div className="text-amber-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{q.evaluation.error_message || "Feedback generation failed."}</span>
                      <Button variant="outline" size="sm" onClick={() => evaluateAnswer(q.id)} className="ml-2">Retry</Button>
                    </div>
                  ) : q.evaluation.structured_data ? (
                    <div className="space-y-4">
                      <p className="text-gray-800 dark:text-gray-200">
                        {q.evaluation.structured_data.summary}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md">
                          <span className="block text-xs text-gray-500 uppercase">Relevance</span>
                          <span className="font-medium capitalize text-blue-700 dark:text-blue-300">{q.evaluation.structured_data.relevance || 'N/A'}</span>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md">
                          <span className="block text-xs text-gray-500 uppercase">Clarity</span>
                          <span className="font-medium capitalize text-blue-700 dark:text-blue-300">{q.evaluation.structured_data.clarity || 'N/A'}</span>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md">
                          <span className="block text-xs text-gray-500 uppercase">Depth</span>
                          <span className="font-medium capitalize text-blue-700 dark:text-blue-300">{q.evaluation.structured_data.depth || 'N/A'}</span>
                        </div>
                        {q.evaluation.structured_data.technical_accuracy && (
                          <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md">
                            <span className="block text-xs text-gray-500 uppercase">Accuracy</span>
                            <span className="font-medium capitalize text-blue-700 dark:text-blue-300">{q.evaluation.structured_data.technical_accuracy}</span>
                          </div>
                        )}
                      </div>
                      
                      {q.evaluation.structured_data.strengths && q.evaluation.structured_data.strengths.length > 0 && (
                        <div>
                          <h5 className="font-medium text-green-700 dark:text-green-500 mb-1">Strengths</h5>
                          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                            {q.evaluation.structured_data.strengths.map((item: string, i: number) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {q.evaluation.structured_data.improvements && q.evaluation.structured_data.improvements.length > 0 && (
                        <div>
                          <h5 className="font-medium text-amber-700 dark:text-amber-500 mb-1">Areas for Improvement</h5>
                          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                            {q.evaluation.structured_data.improvements.map((item: string, i: number) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {q.evaluation.structured_data.suggested_better_answer_points && q.evaluation.structured_data.suggested_better_answer_points.length > 0 && (
                        <div>
                          <h5 className="font-medium text-blue-700 dark:text-blue-500 mb-1">How to answer this better</h5>
                          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                            {q.evaluation.structured_data.suggested_better_answer_points.map((item: string, i: number) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
