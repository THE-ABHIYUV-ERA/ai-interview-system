import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { Resume } from '@/types/resume';

interface AIInsightsProps {
  resume: Resume;
  onUpdate: (updatedResume: Resume) => void;
}

export function AIInsights({ resume, onUpdate }: AIInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resume.analysis_status === 'processing') {
      const interval = setInterval(async () => {
        try {
          const response = await api.get(`/resumes/${resume.id}/`);
          const data = response.data;
          onUpdate(data);
          if (data.analysis_status === 'completed' || data.analysis_status === 'failed') {
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Failed to poll analysis status", err);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [resume.analysis_status, resume.id, onUpdate]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await api.post(`/resumes/${resume.id}/analyze/`);
      // Start polling
      onUpdate({ ...resume, analysis_status: 'processing' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start AI analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderSection = (title: string, data: any) => {
    if (!data) return null;
    
    if (Array.isArray(data) && data.length > 0) {
      return (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-300">{title}</h5>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            {data.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      );
    }
    
    if (typeof data === 'string' && data.length > 0) {
      return (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-300">{title}</h5>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">{data}</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-[#11111A] border border-white/10 rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-medium text-white">AI Resume Insights</h3>
        </div>
        
        {(!resume.analysis_status || resume.analysis_status === 'pending' || resume.analysis_status === 'failed') && (
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Analyze Resume</span>
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 mb-6 italic">
        AI-generated insights are based on the information in your resume and may contain mistakes. Review them before relying on them.
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
           <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
           <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {resume.analysis_status === 'processing' && (
        <div className="py-12 text-center">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Analyzing your resume...</p>
          <p className="text-gray-400 text-sm mt-2">Extracting key insights for your AI interview.</p>
        </div>
      )}
      
      {resume.analysis_status === 'failed' && (
         <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
           <p className="text-gray-400 text-sm">{resume.error_message || "Resume analysis is temporarily unavailable. Please try again."}</p>
         </div>
      )}

      {resume.analysis_status === 'completed' && resume.ai_analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {renderSection("Summary", resume.ai_analysis.summary)}
            {renderSection("Key Skills", resume.ai_analysis.skills)}
            {renderSection("Strengths", resume.ai_analysis.strengths)}
            {renderSection("Areas to Improve", resume.ai_analysis.areas_to_improve)}
          </div>
          <div className="space-y-6">
            {renderSection("Experience Highlights", resume.ai_analysis.experience_highlights)}
            {renderSection("Project Highlights", resume.ai_analysis.project_highlights)}
            {renderSection("Suggested Focus Areas", resume.ai_analysis.suggested_focus_areas)}
          </div>
        </div>
      )}
    </div>
  );
}
