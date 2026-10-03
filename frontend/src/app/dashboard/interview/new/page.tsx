"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { Resume } from '@/types/resume';
import { InterviewConfiguration, ExperienceLevel, InterviewType, Difficulty } from '@/types/interview';
import Link from 'next/link';

export default function NewInterviewPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<InterviewConfiguration>>({
    experience_level: 'mid',
    interview_type: 'technical',
    difficulty: 'medium',
    duration_minutes: 30,
  });

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes/');
      const data = response.data.results || response.data;
      const completedResumes = data.filter((r: Resume) => r.status === 'completed');
      setResumes(completedResumes);
      if (completedResumes.length > 0) {
        setFormData(prev => ({ ...prev, resume: completedResumes[0].id }));
      }
    } catch (err) {
      setError('Failed to load resumes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resume || !formData.job_role || !formData.experience_level || !formData.interview_type || !formData.difficulty || !formData.duration_minutes) {
      setError('Please fill out all required fields.');
      return;
    }

    if (formData.job_role.trim().length === 0) {
      setError('Job role cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await api.post('/interviews/', formData);
      router.push(`/dashboard/interview/${response.data.id}/prepare`);
    } catch (err) {
      const errorResponse = err as { response?: { data?: { detail?: string; error?: string } | Record<string, string[]> } };
      
      const resData = errorResponse.response?.data;
      if (resData && 'detail' in resData && typeof resData.detail === 'string') {
         setError(resData.detail);
      } else if (resData && 'error' in resData && typeof resData.error === 'string') {
         setError(resData.error);
      } else if (resData) {
         // handle object errors
         const firstError = Object.values(resData)[0];
         setError(Array.isArray(firstError) ? firstError[0] : 'Please check your interview settings.');
      } else {
         setError('Something went wrong. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Set Up Your AI Interview</h1>
          <p className="text-gray-400">Configure your interview and get ready for an AI-powered practice session.</p>
        </div>
        <div className="bg-[#11111A] border border-white/10 rounded-xl p-8 text-center space-y-4">
          <FileText className="w-12 h-12 text-gray-500 mx-auto" />
          <h2 className="text-xl font-medium text-white">No processed resume available</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Upload and process your resume before starting an interview. We use your resume to personalize the questions.
          </p>
          <Link 
            href="/dashboard/resume"
            className="inline-block mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Go to Resume Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Set Up Your AI Interview</h1>
        <p className="text-gray-400">Configure your interview and get ready for an AI-powered practice session.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-[#11111A] border border-white/10 rounded-xl p-6 space-y-6">
          
          {/* Resume Selection */}
          <div className="space-y-3">
            <label htmlFor="resume" className="block text-sm font-medium text-gray-300">Select Resume *</label>
            <div className="relative">
              <select
                id="resume"
                name="resume"
                value={formData.resume || ''}
                onChange={handleChange}
                required
                className="w-full bg-[#1A1A24] border border-white/10 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="" disabled>Choose a resume...</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.original_filename}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500">Only fully processed resumes are shown.</p>
          </div>

          {/* Job Role */}
          <div className="space-y-3">
            <label htmlFor="job_role" className="block text-sm font-medium text-gray-300">Job Role *</label>
            <input
              type="text"
              id="job_role"
              name="job_role"
              value={formData.job_role || ''}
              onChange={handleChange}
              placeholder="e.g. Frontend Developer"
              required
              maxLength={100}
              className="w-full bg-[#1A1A24] border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Experience Level */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Experience Level *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'fresher', label: 'Fresher' },
                { id: 'junior', label: 'Junior' },
                { id: 'mid', label: 'Mid-Level' },
                { id: 'senior', label: 'Senior' }
              ].map(level => (
                <label 
                  key={level.id}
                  className={`
                    relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                    ${formData.experience_level === level.id 
                      ? 'bg-blue-500/20 border-blue-500 text-white' 
                      : 'bg-[#1A1A24] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <input
                    type="radio"
                    name="experience_level"
                    value={level.id}
                    checked={formData.experience_level === level.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{level.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Interview Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'technical', label: 'Technical', desc: 'Focus on technical knowledge and problem solving.' },
                { id: 'behavioral', label: 'Behavioral', desc: 'Focus on communication, teamwork and workplace scenarios.' },
                { id: 'mixed', label: 'Mixed', desc: 'Combine technical and behavioral questions.' }
              ].map(type => (
                <label 
                  key={type.id}
                  className={`
                    relative flex flex-col p-4 rounded-lg border cursor-pointer transition-all
                    ${formData.interview_type === type.id 
                      ? 'bg-blue-500/20 border-blue-500' 
                      : 'bg-[#1A1A24] border-white/10 hover:bg-white/5'}
                  `}
                >
                  <input
                    type="radio"
                    name="interview_type"
                    value={type.id}
                    checked={formData.interview_type === type.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${formData.interview_type === type.id ? 'text-white' : 'text-gray-300'}`}>
                      {type.label}
                    </span>
                    {formData.interview_type === type.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                  <span className="text-xs text-gray-500">{type.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Difficulty *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'easy', label: 'Easy' },
                { id: 'medium', label: 'Medium' },
                { id: 'hard', label: 'Hard' }
              ].map(diff => (
                <label 
                  key={diff.id}
                  className={`
                    relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                    ${formData.difficulty === diff.id 
                      ? 'bg-blue-500/20 border-blue-500 text-white' 
                      : 'bg-[#1A1A24] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={diff.id}
                    checked={formData.difficulty === diff.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{diff.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-300">Duration *</label>
            <div className="relative">
              <select
                id="duration_minutes"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                required
                className="w-full bg-[#1A1A24] border border-white/10 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[15, 30, 45, 60, 90, 120].map(mins => (
                  <option key={mins} value={mins}>{mins} Minutes</option>
                ))}
              </select>
            </div>
          </div>
          
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating interview...
              </>
            ) : (
              'Create Interview'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
