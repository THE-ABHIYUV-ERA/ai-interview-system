"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { 
  InterviewSession, 
  InterviewQuestion, 
  InterviewProgress,
  NextQuestionResponse
} from "@/types/interview";
import { Button } from "@/components/ui/button";
import { Play, LogOut, CheckCircle2, Clock, Brain, Loader2 } from "lucide-react";

export default function LiveInterviewRoom() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [progress, setProgress] = useState<InterviewProgress | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nextQuestionLoading, setNextQuestionLoading] = useState(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    
    if (!authLoading && user && params.id) {
      fetchInterviewDetails();
    }
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [user, authLoading, params.id]);

  useEffect(() => {
    if (interview?.started_at && interview.status === "in_progress") {
      if (!timerInterval.current) {
        timerInterval.current = setInterval(() => {
          const started = new Date(interview.started_at!).getTime();
          const now = new Date().getTime();
          setElapsedSeconds(Math.floor((now - started) / 1000));
        }, 1000);
      }
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }
  }, [interview?.started_at, interview?.status]);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/interviews/${params.id}/`);
      setInterview(res.data);
      
      if (res.data.status === "in_progress") {
        await fetchNextQuestion();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load interview details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNextQuestion = async () => {
    try {
      setNextQuestionLoading(true);
      const res = await api.post<NextQuestionResponse>(
        `/interviews/${params.id}/next-question/`,
        {}
      );
      
      setQuestion(res.data.question);
      setProgress(res.data.progress);
      setAnswerText("");
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes("limit")) {
        // Interview reached question limit, mark local state completed
        setInterview(prev => prev ? { ...prev, status: 'completed' } : null);
      } else {
        setError(err.response?.data?.error || "Failed to load the next question.");
      }
    } finally {
      setNextQuestionLoading(false);
    }
  };

  const startInterview = async () => {
    try {
      setStarting(true);
      setError(null);
      const res = await api.post(
        `/interviews/${params.id}/start/`,
        {}
      );
      setInterview(res.data);
      await fetchNextQuestion();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start the interview.");
    } finally {
      setStarting(false);
    }
  };

  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);

  // Load draft from localStorage on mount and when question changes
  useEffect(() => {
    if (question && interview && user) {
      const draftKey = `interview_draft_${user.id}_${interview.id}_${question.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        setAnswerText(savedDraft);
      } else {
        setAnswerText("");
      }
      setAnswerStartTime(Date.now());
    }
  }, [question, interview, user]);

  // Save draft on change
  const handleAnswerChange = (text: string) => {
    setAnswerText(text);
    if (question && interview && user) {
      const draftKey = `interview_draft_${user.id}_${interview.id}_${question.id}`;
      localStorage.setItem(draftKey, text);
    }
  };

  const clearDraft = () => {
    if (question && interview && user) {
      const draftKey = `interview_draft_${user.id}_${interview.id}_${question.id}`;
      localStorage.removeItem(draftKey);
    }
  };

  useEffect(() => {
    // Navigation warning if draft exists
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (answerText.trim() && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answerText, submitting]);

  const submitAnswer = async () => {
    if (!answerText.trim() || !question) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const durationSeconds = answerStartTime 
        ? Math.floor((Date.now() - answerStartTime) / 1000)
        : 0;
      
      await api.post(
        `/interviews/${params.id}/questions/${question.id}/answer/`,
        { 
          answer_text: answerText,
          duration_seconds: durationSeconds
        }
      );
      
      clearDraft();
      await fetchNextQuestion();
    } catch (err: any) {
      // Don't clear answer on error so candidate can retry
      setError(err.response?.data?.detail || err.response?.data?.error || "Your answer was not submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    if (interview?.status === "in_progress") {
      if (confirm("Are you sure you want to exit? Your progress is saved, but you may lose your current unsaved answer.")) {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="border border-red-200 rounded-lg shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="text-xl font-semibold leading-none tracking-tight text-red-600">Error</h3>
          </div>
          <div className="p-6 pt-0">
            <p>{error}</p>
          </div>
          <div className="flex items-center p-6 pt-0">
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col h-[85vh]">
      {/* Header */}
      <header className="flex justify-between items-center bg-white dark:bg-zinc-900 border-b p-4 rounded-t-lg shadow-sm">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            {interview.job_role} Interview
          </h1>
          <p className="text-sm text-gray-500">
            {interview.experience_level} • {interview.interview_type} • {interview.difficulty}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {interview.status === "in_progress" && (
            <div className="flex items-center gap-2 text-lg font-mono">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className={elapsedSeconds > interview.duration_minutes * 60 ? "text-red-500" : ""}>
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-sm text-gray-400">/ {interview.duration_minutes}:00</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleExit}>
            <LogOut className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 dark:bg-zinc-950 p-4 overflow-y-auto">
        {error && interview && (
          <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-md border border-red-100 text-sm">
            {error}
          </div>
        )}

        {interview.status === "ready" && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full">
              <Play className="w-12 h-12 text-blue-500 ml-1" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to begin?</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Your AI interviewer has generated questions tailored to your resume and the {interview.job_role} role. 
                Ensure you are in a quiet environment and have {interview.duration_minutes} minutes available.
              </p>
            </div>
            <Button size="lg" onClick={startInterview} disabled={starting} className="min-w-[200px]">
              {starting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {starting ? "Starting..." : "Start Interview"}
            </Button>
          </div>
        )}

        {interview.status === "in_progress" && question && (
          <div className="max-w-3xl mx-auto flex flex-col h-full gap-4">
            
            <div className="flex items-center justify-between text-sm font-medium text-gray-500 px-1">
              <span>Question {progress?.current} of {progress?.total}</span>
              <span className="uppercase text-xs tracking-wider bg-gray-200 dark:bg-zinc-800 px-2 py-1 rounded">
                {question.question_type}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${(progress?.current || 1) / (progress?.total || 10) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/30 bg-white dark:bg-zinc-950 text-card-foreground">
              <div className="p-6">
                <p className="text-xl leading-relaxed font-medium">
                  {question.question_text}
                </p>
              </div>
            </div>

            {/* Answer Area */}
            <div className="flex-1 flex flex-col gap-3 min-h-[200px]">
              <div className="flex justify-between items-end">
                <label htmlFor="answer" className="sr-only">Your Answer</label>
                <span className={`text-xs ${answerText.length > 19000 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {answerText.length} / 20000 chars
                </span>
              </div>
              <textarea 
                id="answer"
                value={answerText}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here... Be detailed and specific."
                className="flex-1 w-full rounded-md border border-input bg-transparent text-base p-4 resize-none shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting || nextQuestionLoading}
                maxLength={20000}
              />
              
              <div className="flex justify-end">
                <Button 
                  onClick={submitAnswer} 
                  disabled={!answerText.trim() || submitting || nextQuestionLoading}
                  className="min-w-[150px]"
                >
                  {(submitting || nextQuestionLoading) ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              </div>
            </div>
            
          </div>
        )}

        {(interview.status === "completed" || interview.status === "cancelled") && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Interview {interview.status === 'completed' ? 'Completed' : 'Cancelled'}</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Your interview responses have been recorded. The interview report will be available in a later phase.
              </p>
            </div>
            <Button size="lg" onClick={() => router.push("/dashboard")} variant="outline">
              Return to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
