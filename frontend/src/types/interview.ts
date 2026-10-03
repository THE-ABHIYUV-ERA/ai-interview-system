export type ExperienceLevel = 'fresher' | 'junior' | 'mid' | 'senior';
export type InterviewType = 'technical' | 'behavioral' | 'mixed';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type InterviewStatus = 'draft' | 'ready' | 'in_progress' | 'completed' | 'cancelled';

export interface InterviewSession {
  id: string | number;
  candidate: string | number;
  resume: string | number;
  job_role: string;
  experience_level: ExperienceLevel;
  interview_type: InterviewType;
  difficulty: Difficulty;
  duration_minutes: number;
  status: InterviewStatus;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface InterviewConfiguration {
  resume: string | number;
  job_role: string;
  experience_level: ExperienceLevel;
  interview_type: InterviewType;
  difficulty: Difficulty;
  duration_minutes: number;
}
