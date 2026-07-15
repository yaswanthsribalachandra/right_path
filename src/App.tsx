import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import UploadResumePage from './pages/UploadResumePage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import CareerSuggestionsPage from './pages/CareerSuggestionsPage';
import RoadmapPage from './pages/RoadmapPage';
import LearningProgressPage from './pages/LearningProgressPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import ChatPage from './pages/ChatPage';
import SavedCareersPage from './pages/SavedCareersPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/resume/upload" element={<ProtectedRoute><UploadResumePage /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumeAnalysisPage /></ProtectedRoute>} />
            <Route path="/careers" element={<ProtectedRoute><CareerSuggestionsPage /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
            <Route path="/learning" element={<ProtectedRoute><LearningProgressPage /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><InterviewPrepPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedCareersPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
