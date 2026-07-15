import url from 'url';

import adminStats from '../api-handlers/admin-stats.js';
import careerMatch from '../api-handlers/career-match.js';
import careerPaths from '../api-handlers/career-paths.js';
import certifications from '../api-handlers/certifications.js';
import chat from '../api-handlers/chat.js';
import companies from '../api-handlers/companies.js';
import courses from '../api-handlers/courses.js';
import feedback from '../api-handlers/feedback.js';
import interviewQuestions from '../api-handlers/interview-questions.js';
import learningProgress from '../api-handlers/learning-progress.js';
import mockInterviews from '../api-handlers/mock-interviews.js';
import notifications from '../api-handlers/notifications.js';
import profile from '../api-handlers/profile.js';
import projects from '../api-handlers/projects.js';
import resumes from '../api-handlers/resumes.js';
import roadmaps from '../api-handlers/roadmaps.js';
import salaryInsights from '../api-handlers/salary-insights.js';
import savedCareers from '../api-handlers/saved-careers.js';
import uploadResumeFile from '../api-handlers/upload-resume-file.js';

const routes = {
  '/api/admin-stats': adminStats,
  '/api/career-match': careerMatch,
  '/api/career-paths': careerPaths,
  '/api/certifications': certifications,
  '/api/chat': chat,
  '/api/companies': companies,
  '/api/courses': courses,
  '/api/feedback': feedback,
  '/api/interview-questions': interviewQuestions,
  '/api/learning-progress': learningProgress,
  '/api/mock-interviews': mockInterviews,
  '/api/notifications': notifications,
  '/api/profile': profile,
  '/api/projects': projects,
  '/api/resumes': resumes,
  '/api/roadmaps': roadmaps,
  '/api/salary-insights': salaryInsights,
  '/api/saved-careers': savedCareers,
  '/api/upload-resume-file': uploadResumeFile,
};

export default async function handler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Remove trailing slash if any
  const routePath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  const handlerFn = routes[routePath];
  if (handlerFn) {
    return handlerFn(req, res);
  }

  res.status(404).json({ error: `Not found: ${pathname}` });
}
