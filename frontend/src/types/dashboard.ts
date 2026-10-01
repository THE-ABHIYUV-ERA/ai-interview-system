export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface InterviewSummary {
  id: string;
  role: string;
  date: string;
  score: number | null;
  status: 'Completed' | 'In Progress' | 'Scheduled';
}

export interface DashboardStats {
  totalInterviews: number | null;
  averageScore: number | null;
  bestScore: number | null;
  practiceHours: number | null;
}

export interface PerformanceData {
  category: string;
  score: number;
  fullMark: number;
}
