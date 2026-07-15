export type UserRole = 'student' | 'mentor' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  career_goal: string | null;
  interests: string[];
  location: string | null;
  phone: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  created_at: string;
}

export interface MatchedSkill {
  name: string;
  category: string;
}

export interface ParsedResumeData {
  name: string;
  email: string | null;
  phone: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  summary: string;
  education: string[];
  experience: string[];
  projects: string[];
  achievements: string[];
  certificationsRaw: string[];
  skillsRaw: string[];
  matchedSkills: MatchedSkill[];
  wordCount: number;
  lineCount: number;
}

export interface AtsBreakdownItem {
  category: string;
  score: number;
  max: number;
  detail: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string | null;
  raw_text: string;
  parsed_data: ParsedResumeData;
  ats_score: number;
  ats_breakdown: AtsBreakdownItem[];
  created_at: string;
}

export interface CareerPath {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  avg_salary_min: number;
  avg_salary_max: number;
  growth_outlook: string;
  icon: string;
}

export interface CareerMatch {
  careerPath: CareerPath;
  matchScore: number;
  matchedRequiredSkills: string[];
  matchedNiceToHaveSkills: string[];
  missingRequiredSkills: string[];
  requiredCoverage: number;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  duration: string;
  skills: string[];
  courses: Course[];
  certifications: Certification[];
  projects: ProjectItem[];
}

export interface Roadmap {
  id: string;
  user_id: string;
  career_path_id: number;
  title: string;
  phases: RoadmapPhase[];
  progress: number;
  created_at: string;
}

export interface LearningProgressItem {
  id: string;
  user_id: string;
  roadmap_id: string | null;
  item_title: string;
  item_type: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
  created_at: string;
}

export interface ProjectItem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  skills: string[];
  career_category: string;
}

export interface Course {
  id: number;
  title: string;
  provider: string;
  url: string;
  skill_tags: string[];
  level: string;
  rating: number;
  price: string;
}

export interface Certification {
  id: number;
  title: string;
  provider: string;
  skill_tags: string[];
  level: string;
  url: string;
}

export interface InterviewQuestion {
  id: number;
  role: string;
  category: string;
  question: string;
  answer_guidance: string;
  difficulty: string;
}

export interface MockInterviewFeedback {
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  detailed: Array<{ question: string; answer: string; score: number; feedback: string; category: string }>;
}

export interface MockInterview {
  id: string;
  user_id: string;
  role: string;
  questions: InterviewQuestion[];
  answers: string[];
  score: number;
  feedback: MockInterviewFeedback;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  message: string;
  sources: Array<{ type: string; title: string; relevance: number }>;
  created_at: string;
}

export interface SavedCareer {
  id: string;
  user_id: string;
  career_path_id: number;
  created_at: string;
  careerPath: CareerPath;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  roles: string[];
  avg_salary: number;
  locations: string[];
  logo_url: string | null;
  description: string;
  career_category: string;
}

export interface SalaryInsight {
  query: string;
  overallRange: { min: number; max: number; currency: string } | null;
  byExperienceLevel: Array<{ level: string; min: number; max: number; currency: string; sampleSize: number }>;
  sources: Array<{ role: string; location: string; level: string }>;
}
