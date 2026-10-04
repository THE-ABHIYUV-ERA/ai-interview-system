"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { InterviewSession } from "@/types/interview";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Info,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  ChevronLeft,
  ThumbsUp,
  Target
} from "lucide-react";

interface QuestionTypeInsight {
  type: string;
  answered: number;
  feedback: string;
}

interface InterviewReportData {
  summary: string;
  questions_answered: number;
  questions_total: number;
  answer_coverage: {
    answered: number;
    unanswered: number;
  };
  strengths: string[];
  improvement_areas: string[];
  question_type_insights: QuestionTypeInsight[];
  communication_feedback: string;
  technical_feedback: string;
  recommended_practice: string[];
}

interface InterviewReport {
  id: number;
  status: "pending" | "processing" | "completed" | "failed";
  report_data: InterviewReportData | null;
  error_message: string;
}

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    
    if (!authLoading && user && params.id) {
      fetchData();
    }
    
    return () => stopPolling();
  }, [user, authLoading, params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/interviews/${params.id}/`);
      setInterview(res.data);
      
      // If it's not completed, they shouldn't be here
      if (res.data.status !== "completed") {
        router.push(`/dashboard/interview/${params.id}`);
        return;
      }
      
      await fetchReport();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load interview details.");
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await api.get(`/interviews/${params.id}/report/`);
      setReport(res.data);
      
      if (res.data.status === "pending" || res.data.status === "processing") {
        startPolling();
      } else {
        stopPolling();
        setLoading(false);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Trigger completion manually if report not found but interview is completed
        await api.post(`/interviews/${params.id}/complete/`);
        startPolling();
      } else {
        setError(err.response?.data?.detail || "Failed to load interview report.");
        setLoading(false);
        stopPolling();
      }
    }
  };

  const startPolling = () => {
    if (!pollInterval.current) {
      pollInterval.current = setInterval(fetchReport, 3000);
    }
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  if (loading || (report && (report.status === "pending" || report.status === "processing"))) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center space-y-6">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Generating Final Report</h2>
          <p className="text-gray-500 text-sm max-w-sm">
            AI is analyzing your answers and aggregating feedback. This may take up to a minute...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
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
  
  if (report?.status === "failed") {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center space-y-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold mb-2">Report Generation Failed</h2>
          <p className="text-gray-500">{report.error_message || "An unexpected error occurred."}</p>
        </div>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const data = report?.report_data;
  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto w-full py-8 px-4">
      <Button 
        variant="ghost" 
        className="mb-6 -ml-4 text-gray-500 hover:text-gray-900"
        onClick={() => router.push("/dashboard")}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Button>

      <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            Interview Final Report
          </h1>
          <p className="text-gray-500 text-lg">
            {interview?.job_role} • {interview?.experience_level} • {interview?.interview_type}
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex items-start gap-3 text-sm max-w-sm">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>Disclaimer:</strong> AI-generated feedback is intended for interview practice and may contain mistakes. It should not be treated as a hiring decision.
          </p>
        </div>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Answer Coverage</span>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold text-blue-600">{data.questions_answered}</span>
            <span className="text-gray-400 mb-1">/ {data.questions_total}</span>
          </div>
          <span className="text-xs text-gray-400 mt-2">Questions Answered</span>
        </div>
        
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border shadow-sm md:col-span-2 flex flex-col justify-center">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Overall Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {data.summary}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Strengths */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-500" />
            Strengths
          </h3>
          {data.strengths.length > 0 ? (
            <ul className="space-y-3">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No specific strengths highlighted.</p>
          )}
        </div>

        {/* Improvements */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            Areas for Improvement
          </h3>
          {data.improvement_areas.length > 0 ? (
            <ul className="space-y-3">
              {data.improvement_areas.map((s, i) => (
                <li key={i} className="flex gap-3 text-gray-700 dark:text-gray-300">
                  <span className="text-amber-500 shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No specific areas for improvement highlighted.</p>
          )}
        </div>
      </div>

      {/* Detailed Feedback */}
      <div className="space-y-6 mb-8">
        <h3 className="text-2xl font-bold mt-12 mb-6 border-b pb-2">Detailed Feedback</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-100 dark:border-zinc-800">
            <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Communication
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {data.communication_feedback || "No communication feedback available."}
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-100 dark:border-zinc-800">
            <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-500" />
              Technical / Domain
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {data.technical_feedback || "No technical feedback available."}
            </p>
          </div>
        </div>
      </div>

      {/* Question Type Insights */}
      {data.question_type_insights && data.question_type_insights.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6">Question Type Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.question_type_insights.map((qt, i) => (
              <div key={i} className="bg-white dark:bg-zinc-950 p-5 rounded-lg border shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold uppercase text-xs tracking-wider text-gray-500">{qt.type}</span>
                  <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{qt.answered} answered</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{qt.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Practice */}
      {data.recommended_practice && data.recommended_practice.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-12">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">Recommended Next Steps</h3>
          <ul className="space-y-3">
            {data.recommended_practice.map((rp, i) => (
              <li key={i} className="flex gap-3 text-blue-800 dark:text-blue-200">
                <span className="shrink-0">•</span>
                <span>{rp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-center gap-4 border-t pt-8">
        <Button size="lg" variant="outline" onClick={() => router.push(`/dashboard/interview/${params.id}`)}>
          Review Individual Answers
        </Button>
        <Button size="lg" onClick={() => router.push("/dashboard/interview/new")}>
          Start Another Interview
        </Button>
      </div>

    </div>
  );
}
