"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, PlayCircle, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { InterviewSession } from '@/types/interview';
import Link from 'next/link';

export default function InterviewPreparePage() {
  const router = useRouter();
  const params = useParams();
  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchInterview(params.id as string);
    }
  }, [params.id]);

  const fetchInterview = async (id: string) => {
    try {
      const response = await api.get(`/interviews/${id}/`);
      setInterview(response.data);
    } catch (err) {
      setError('Failed to load interview details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!interview) return;
    try {
      setIsStarting(true);
      setError(null);
      await api.post(`/interviews/${interview.id}/start/`);
      setStarted(true);
    } catch (err) {
      const errorResponse = err as { response?: { data?: { detail?: string; error?: string } } };
      setError(errorResponse.response?.data?.error || errorResponse.response?.data?.detail || 'Failed to start interview.');
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-medium text-white">Interview not found</h2>
        <p className="text-gray-400">The requested interview does not exist or you do not have permission to view it.</p>
        <Link href="/dashboard" className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="bg-[#11111A] border border-white/10 rounded-xl p-8 shadow-xl relative overflow-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Interview Ready</h1>
          <p className="text-gray-400">Review your settings before starting the session.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {started ? (
          <div className="py-12 text-center space-y-6">
             <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
             <div>
               <h2 className="text-2xl font-bold text-white mb-2">Session Started</h2>
               <p className="text-gray-400 max-w-md mx-auto">
                 Interview session started. The live interview room will be available in the next phase of development.
               </p>
             </div>
             <Link href="/dashboard" className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors">
               Return to Dashboard
             </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Job Role</span>
                <p className="text-white font-medium text-lg">{interview.job_role}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Experience</span>
                <p className="text-white font-medium capitalize">{interview.experience_level}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Interview Type</span>
                <p className="text-white font-medium capitalize">{interview.interview_type}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Difficulty</span>
                <p className="text-white font-medium capitalize">{interview.difficulty}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Duration</span>
                <p className="text-white font-medium">{interview.duration_minutes} Minutes</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Resume Reference</span>
                <div className="flex items-center space-x-2 text-white">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Attached</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-white/10 pt-6">
              <p className="text-sm text-gray-400">
                You will be recorded. Make sure your microphone and camera are ready.
              </p>
              <button
                onClick={handleStartInterview}
                disabled={isStarting}
                className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Start Interview
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
