import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Loader2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { Resume } from '@/types/resume';

type UploadState = 'IDLE' | 'FILE_SELECTED' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [existingResume, setExistingResume] = useState<Resume | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetchExistingResume();
  }, []);

  const fetchExistingResume = async () => {
    try {
      setLoadingInitial(true);
      const response = await api.get('/resumes/');
      const resumes = response.data.results || response.data;
      if (resumes && resumes.length > 0) {
        // Assume first resume is the current one
        setExistingResume(resumes[0]);
        if (resumes[0].status === 'processing') {
          setState('PROCESSING');
          startPolling(resumes[0].id);
        } else if (resumes[0].status === 'completed') {
          setState('COMPLETED');
        } else if (resumes[0].status === 'failed') {
          setState('FAILED');
          setError(resumes[0].error_message || 'Resume processing failed.');
        } else {
          setState('COMPLETED'); // default idle state if it has a resume
        }
      }
    } catch (err) {
      console.error('Failed to fetch resumes', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const startPolling = (id: string | number) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/resumes/${id}/`);
        const data = response.data;
        if (data.status === 'completed') {
          clearInterval(interval);
          setExistingResume(data);
          setState('COMPLETED');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setExistingResume(data);
          setState('FAILED');
          setError(data.error_message || 'Resume processing failed.');
        }
      } catch (err) {
        clearInterval(interval);
        setState('FAILED');
        setError('Failed to poll resume status.');
      }
    }, 3000);
    return () => clearInterval(interval);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Resume must be smaller than 5 MB.');
      return;
    }
    setFile(selectedFile);
    setState('FILE_SELECTED');
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setState('UPLOADING');
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/resumes/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = response.data;
      setExistingResume(data);
      
      if (data.status === 'processing') {
        setState('PROCESSING');
        startPolling(data.id);
      } else if (data.status === 'completed') {
        setState('COMPLETED');
      } else if (data.status === 'failed') {
        setState('FAILED');
        setError(data.error_message || 'Resume processing failed.');
      } else {
        setState('PROCESSING'); // fallback
        startPolling(data.id);
      }
    } catch (err: any) {
      setState('FAILED');
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred during upload. Please try again.');
      }
    }
  };

  const resetUpload = () => {
    setFile(null);
    setState('IDLE');
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const handleDelete = async () => {
      if (!existingResume) return;
      try {
          await api.delete(`/resumes/${existingResume.id}/`);
          setExistingResume(null);
          resetUpload();
      } catch (err) {
          console.error('Failed to delete resume', err);
          setError('Failed to delete resume.');
      }
  };

  if (loadingInitial) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Existing Resume Section */}
      {existingResume && state !== 'UPLOADING' && state !== 'PROCESSING' && (
        <div className="bg-[#11111A] border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Current Resume</h3>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-white font-medium">{existingResume.original_filename}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>{formatFileSize(existingResume.file_size || 0)}</span>
                  <span>•</span>
                  <span>Uploaded on {new Date(existingResume.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            {state === 'COMPLETED' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {state === 'FAILED' && <AlertCircle className="w-5 h-5 text-red-400" />}
          </div>
          
          {state === 'FAILED' && error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
               <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
               <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end space-x-4">
             <button
               onClick={handleDelete}
               className="text-sm text-red-400 hover:text-red-300 transition-colors"
             >
               Delete Resume
             </button>
             <button
               onClick={resetUpload}
               className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
             >
               Replace Resume
             </button>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {(!existingResume || state === 'IDLE' || state === 'FILE_SELECTED' || state === 'UPLOADING' || state === 'PROCESSING' || (state === 'FAILED' && !existingResume)) && (
        <div className="bg-[#11111A] border border-white/10 rounded-xl p-6">
          
          {(state === 'IDLE' || state === 'FAILED') && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
                ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/20 hover:border-blue-500/50 hover:bg-white/5'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              tabIndex={0}
              role="button"
              aria-label="Upload resume"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
              />
              <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${error ? 'text-red-400' : 'text-gray-400'}`} />
              <p className="text-white font-medium mb-1">Drag and drop your resume here</p>
              <p className="text-gray-400 text-sm">or click to browse (PDF only, max 5MB)</p>
            </div>
          )}

          {state === 'FILE_SELECTED' && file && (
            <div className="p-6 border border-blue-500/30 bg-blue-500/5 rounded-xl text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-gray-400 text-sm mb-6">{formatFileSize(file.size)}</p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Upload Resume
                </button>
              </div>
            </div>
          )}

          {state === 'UPLOADING' && (
            <div className="p-12 text-center" aria-live="polite">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Uploading resume...</p>
              <p className="text-gray-400 text-sm mt-2">Please do not close this window.</p>
            </div>
          )}

          {state === 'PROCESSING' && (
            <div className="p-12 text-center" aria-live="polite">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Processing your resume...</p>
              <p className="text-gray-400 text-sm mt-2">We are extracting text from your PDF.</p>
            </div>
          )}

          {error && state !== 'FAILED' && state !== 'FILE_SELECTED' && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2" role="alert">
               <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
               <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
