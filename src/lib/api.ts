import type {
  Profile, Resume, CareerPath, CareerMatch, Roadmap, LearningProgressItem,
  ProjectItem, Course, Certification, InterviewQuestion, MockInterview,
  ChatMessage, SavedCareer, AppNotification, Company, SalaryInsight,
} from './types';

async function jsonFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* noop */ }
    throw new Error(message);
  }
  return res.json();
}

// ---- Profile ----
export const getProfile = (userId: string) => jsonFetch<Profile | null>(`/api/profile?user_id=${userId}`);
export const createProfile = (payload: { user_id: string; email: string; full_name?: string }) =>
  jsonFetch<Profile>('/api/profile', { method: 'POST', body: JSON.stringify(payload) });
export const updateProfile = (payload: Partial<Profile> & { user_id: string }) =>
  jsonFetch<Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(payload) });

// ---- Resumes ----
export const getResumes = (userId: string) => jsonFetch<Resume[]>(`/api/resumes?user_id=${userId}`);
export const getResume = (id: string) => jsonFetch<Resume>(`/api/resumes?id=${id}`);
export const uploadResumeAnalysis = (payload: { user_id: string; file_name: string; file_url?: string; raw_text: string }) =>
  jsonFetch<Resume>('/api/resumes', { method: 'POST', body: JSON.stringify(payload) });
export const deleteResume = (id: string) => jsonFetch<{ ok: boolean }>('/api/resumes', { method: 'DELETE', body: JSON.stringify({ id }) });
export const uploadResumeFile = (payload: { fileName: string; fileBase64: string; contentType: string; user_id: string }) =>
  jsonFetch<{ url: string }>('/api/upload-resume-file', { method: 'POST', body: JSON.stringify(payload) });

// ---- Career Paths ----
export const getCareerPaths = (category?: string) => jsonFetch<CareerPath[]>(`/api/career-paths${category ? `?category=${category}` : ''}`);
export const getCareerPath = (id: number | string) => jsonFetch<CareerPath>(`/api/career-paths?id=${id}`);
export const matchCareers = (payload: { user_id: string; resume_id?: string }) =>
  jsonFetch<{ userSkills: string[]; matches: CareerMatch[] }>('/api/career-match', { method: 'POST', body: JSON.stringify(payload) });

// ---- Roadmaps ----
export const getRoadmaps = (userId: string) => jsonFetch<Roadmap[]>(`/api/roadmaps?user_id=${userId}`);
export const getRoadmap = (id: string) => jsonFetch<Roadmap>(`/api/roadmaps?id=${id}`);
export const createRoadmap = (payload: { user_id: string; career_path_id: number }) =>
  jsonFetch<Roadmap>('/api/roadmaps', { method: 'POST', body: JSON.stringify(payload) });
export const deleteRoadmap = (id: string) => jsonFetch<{ ok: boolean }>('/api/roadmaps', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- Learning Progress ----
export const getLearningProgress = (userId: string, roadmapId?: string) =>
  jsonFetch<LearningProgressItem[]>(`/api/learning-progress?user_id=${userId}${roadmapId ? `&roadmap_id=${roadmapId}` : ''}`);
export const addLearningItem = (payload: { user_id: string; roadmap_id?: string; item_title: string; item_type: string }) =>
  jsonFetch<LearningProgressItem>('/api/learning-progress', { method: 'POST', body: JSON.stringify(payload) });
export const updateLearningItem = (payload: { id: string; status: string }) =>
  jsonFetch<LearningProgressItem>('/api/learning-progress', { method: 'PUT', body: JSON.stringify(payload) });

// ---- Projects / Courses / Certifications ----
export const getProjects = (params?: { category?: string; skill?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return jsonFetch<ProjectItem[]>(`/api/projects${q ? `?${q}` : ''}`);
};
export const getCourses = (skill?: string) => jsonFetch<Course[]>(`/api/courses${skill ? `?skill=${skill}` : ''}`);
export const getCertifications = (skill?: string) => jsonFetch<Certification[]>(`/api/certifications${skill ? `?skill=${skill}` : ''}`);

// ---- Interview ----
export const getInterviewQuestions = (params?: { role?: string; category?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return jsonFetch<InterviewQuestion[]>(`/api/interview-questions${q ? `?${q}` : ''}`);
};
export const getMockInterviews = (userId: string) => jsonFetch<MockInterview[]>(`/api/mock-interviews?user_id=${userId}`);
export const startMockInterview = (payload: { role?: string; count?: number }) =>
  jsonFetch<{ questions: InterviewQuestion[] }>('/api/mock-interviews', { method: 'POST', body: JSON.stringify({ action: 'start', ...payload }) });
export const submitMockInterview = (payload: { user_id: string; role: string; questions: InterviewQuestion[]; answers: string[] }) =>
  jsonFetch<MockInterview>('/api/mock-interviews', { method: 'POST', body: JSON.stringify({ action: 'submit', ...payload }) });

// ---- Chat ----
export const getChatHistory = (userId: string) => jsonFetch<ChatMessage[]>(`/api/chat?user_id=${userId}`);
export const sendChatMessage = (payload: { user_id: string; message: string }) =>
  jsonFetch<ChatMessage>('/api/chat', { method: 'POST', body: JSON.stringify(payload) });

// ---- Saved Careers ----
export const getSavedCareers = (userId: string) => jsonFetch<SavedCareer[]>(`/api/saved-careers?user_id=${userId}`);
export const saveCareer = (payload: { user_id: string; career_path_id: number }) =>
  jsonFetch<SavedCareer>('/api/saved-careers', { method: 'POST', body: JSON.stringify(payload) });
export const unsaveCareer = (id: string) => jsonFetch<{ ok: boolean }>('/api/saved-careers', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- Notifications ----
export const getNotifications = (userId: string) => jsonFetch<AppNotification[]>(`/api/notifications?user_id=${userId}`);
export const markNotificationRead = (id: string, read: boolean) =>
  jsonFetch<AppNotification>('/api/notifications', { method: 'PUT', body: JSON.stringify({ id, read }) });
export const markAllNotificationsRead = (userId: string) =>
  jsonFetch<{ ok: boolean }>('/api/notifications', { method: 'PUT', body: JSON.stringify({ user_id: userId, mark_all: true }) });
export const deleteNotification = (id: string) =>
  jsonFetch<{ ok: boolean }>('/api/notifications', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- Companies / Salary ----
export const getCompanies = (params?: { category?: string; search?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return jsonFetch<Company[]>(`/api/companies${q ? `?${q}` : ''}`);
};
export const getSalaryInsight = (query: string, location?: string) =>
  jsonFetch<SalaryInsight>(`/api/salary-insights?query=${encodeURIComponent(query)}${location ? `&location=${encodeURIComponent(location)}` : ''}`);

// ---- Feedback ----
export const submitFeedback = (payload: { user_id: string; rating: number; comment?: string; category?: string }) =>
  jsonFetch<{ id: string }>('/api/feedback', { method: 'POST', body: JSON.stringify(payload) });

// ---- Admin ----
export interface AdminStats {
  totalUsers: number;
  totalResumes: number;
  totalRoadmaps: number;
  totalMockInterviews: number;
  totalChatMessages: number;
  avgAtsScore: number;
  avgFeedbackRating: number;
  recentFeedback: Array<{ id: string; user_id: string; rating: number; comment: string; category: string; created_at: string }>;
  recentActivity: Array<{ id: string; user_id: string; action: string; meta: Record<string, unknown>; created_at: string }>;
  recentUsers: Profile[];
}
export const getAdminStats = () => jsonFetch<AdminStats>('/api/admin-stats');
