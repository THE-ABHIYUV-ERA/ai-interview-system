"use client";

import { PerformanceData } from "@/types/dashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BarChart2 } from "lucide-react";

export function PerformanceOverview({ data }: { data: PerformanceData[] }) {
  return (
    <div className="bg-[#111116] border border-white/5 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Performance Analytics</h3>
      </div>
      
      <div className="flex-1 p-6 flex flex-col min-h-[300px]">
        {data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-white/70 font-medium mb-1">Analytics locked</p>
            <p className="text-sm text-white/40 max-w-[250px]">Complete your first interview to unlock performance analytics.</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
