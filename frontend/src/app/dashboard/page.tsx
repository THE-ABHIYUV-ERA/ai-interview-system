"use client";

import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { StartInterviewCard } from "@/components/dashboard/StartInterviewCard";
import { RecentInterviews } from "@/components/dashboard/RecentInterviews";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { PracticeCard } from "@/components/dashboard/PracticeCard";
import { DashboardStats, InterviewSummary, PerformanceData } from "@/types/dashboard";

export default function DashboardPage() {
  // Mock empty states for Phase 3
  const stats: DashboardStats = {
    totalInterviews: null,
    averageScore: null,
    bestScore: null,
    practiceHours: null,
  };

  const recentInterviews: InterviewSummary[] = [];
  const performanceData: PerformanceData[] = [];

  return (
    <div className="w-full">
      <WelcomeSection />
      
      <StatsCards stats={stats} />
      
      <StartInterviewCard />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <RecentInterviews interviews={recentInterviews} />
        </div>
        
        <div className="space-y-8">
          <PerformanceOverview data={performanceData} />
          <PracticeCard />
        </div>
      </div>
    </div>
  );
}
