"use client";

import { motion } from "framer-motion";
import { InterviewSummary } from "@/types/dashboard";
import { FileText } from "lucide-react";

export function RecentInterviews({ interviews }: { interviews: InterviewSummary[] }) {
  return (
    <div className="bg-[#111116] border border-white/5 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Recent Interviews</h3>
      </div>
      
      <div className="flex-1 p-6 flex flex-col">
        {interviews.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-white/70 font-medium mb-1">No interviews yet</p>
            <p className="text-sm text-white/40 max-w-[250px]">Your completed interviews will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Will render interviews list here when implemented */}
          </div>
        )}
      </div>
    </div>
  );
}
