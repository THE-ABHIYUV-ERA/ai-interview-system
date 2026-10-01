"use client";

import { ResumeUpload } from "@/components/resume/ResumeUpload";

export default function ResumePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Resume</h1>
        <p className="text-gray-400">Upload your resume to personalize your AI interview experience.</p>
      </div>

      <ResumeUpload />
    </div>
  );
}
