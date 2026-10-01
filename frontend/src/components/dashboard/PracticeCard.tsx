"use client";

import { Button } from "@/components/ui/button";
import { Code, MessageSquare, FileText } from "lucide-react";

export function PracticeCard() {
  const practices = [
    { icon: Code, title: "Technical Questions", color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: MessageSquare, title: "Behavioral Questions", color: "text-violet-400", bg: "bg-violet-500/10" },
    { icon: FileText, title: "Resume Questions", color: "text-emerald-400", bg: "bg-emerald-500/10" }
  ];

  return (
    <div className="bg-[#111116] border border-white/5 rounded-xl overflow-hidden h-full">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-lg font-medium text-white mb-1">AI Practice</h3>
        <p className="text-sm text-white/50">Build confidence before your next interview.</p>
      </div>
      
      <div className="p-6 space-y-4">
        {practices.map((practice, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5 cursor-not-allowed opacity-70">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${practice.bg}`}>
                <practice.icon className={`w-4 h-4 ${practice.color}`} />
              </div>
              <span className="font-medium text-white/80 group-hover:text-white transition-colors">{practice.title}</span>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded bg-white/5 text-white/40 uppercase tracking-wider">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
