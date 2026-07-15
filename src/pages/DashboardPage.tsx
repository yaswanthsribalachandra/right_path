import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Compass, Map as MapIcon, Mic, TrendingUp, ArrowRight,
  Sparkles, Target, Clock,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import { useAuth } from '../contexts/AuthContext';
import { getResumes, getRoadmaps, getMockInterviews, getNotifications } from '../lib/api';
import type { Resume, Roadmap, MockInterview, AppNotification } from '../lib/types';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getResumes(user.id).catch(() => []),
      getRoadmaps(user.id).catch(() => []),
      getMockInterviews(user.id).catch(() => []),
      getNotifications(user.id).catch(() => []),
    ]).then(([r, rm, mi, n]) => {
      setResumes(r); setRoadmaps(rm); setInterviews(mi); setNotifications(n);
    }).finally(() => setLoading(false));
  }, [user]);

  const latestResume = resumes[0];
  const activeRoadmap = roadmaps[0];
  const avgInterviewScore = interviews.length
    ? Math.round((interviews.reduce((s, i) => s + Number(i.score), 0) / interviews.length) * 10) / 10
    : null;

  if (loading) return <DashboardLayout><Loader label="Loading your dashboard..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-text mb-1">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}.
        </h1>
        <p className="text-muted">Here's where your career intelligence stands today.</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard icon={FileText} label="Latest ATS Score" value={latestResume ? `${latestResume.ats_score}/100` : '—'} accent="var(--color-emerald)" />
        <StatCard icon={MapIcon} label="Active Roadmap" value={activeRoadmap ? `${Math.round(activeRoadmap.progress)}% complete` : 'None yet'} accent="var(--color-amber)" />
        <StatCard icon={Mic} label="Mock Interview Avg" value={avgInterviewScore !== null ? `${avgInterviewScore}/10` : '—'} accent="var(--color-rose)" />
        <StatCard icon={Sparkles} label="Unread Alerts" value={String(notifications.filter((n) => !n.read).length)} accent="var(--color-ice)" />
      </div>

      {/* Main actions */}
      <div className="grid lg:grid-cols-3 gap-5 mt-8">
        <div className="lg:col-span-2 glass rounded-2xl p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl text-text">Resume Intelligence</h2>
            <FileText className="h-5 w-5 text-faint" />
          </div>
          {latestResume ? (
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="relative h-20 w-20 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-3)' }}>
                  <span className="font-display text-2xl" style={{ color: scoreColor(latestResume.ats_score) }}>{latestResume.ats_score}</span>
                </div>
                <div>
                  <p className="text-text font-medium">{latestResume.file_name}</p>
                  <p className="text-sm text-muted">Analyzed {new Date(latestResume.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-muted mt-1">{(latestResume.parsed_data?.matchedSkills || []).length} skills detected</p>
                </div>
              </div>
              <Link to="/resume" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-emerald)' }}>
                View full breakdown <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted mb-4">No resume uploaded yet. Upload one to unlock ATS scoring and career matching.</p>
              <Link to="/resume" className="inline-flex items-center gap-2 text-ink font-semibold px-5 py-2.5 rounded-full text-sm" style={{ background: 'var(--color-emerald)' }}>
                Upload Resume <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-7 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl text-text">Quick Actions</h2>
            <Target className="h-5 w-5 text-faint" />
          </div>
          <div className="space-y-2.5 flex-1">
            <QuickLink to="/careers" icon={Compass} label="Explore Career Matches" />
            <QuickLink to="/roadmap" icon={MapIcon} label="Generate a Roadmap" />
            <QuickLink to="/interview" icon={Mic} label="Practice Mock Interview" />
            <QuickLink to="/chat" icon={Sparkles} label="Ask AI Career Coach" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <div className="glass rounded-2xl p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl text-text">Roadmap Progress</h2>
            <TrendingUp className="h-5 w-5 text-faint" />
          </div>
          {activeRoadmap ? (
            <div>
              <p className="text-text font-medium mb-2">{activeRoadmap.title}</p>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--color-surface-3)' }}>
                <div className="h-full rounded-full" style={{ width: `${activeRoadmap.progress}%`, background: 'var(--color-emerald)' }} />
              </div>
              <p className="text-sm text-muted">{Math.round(activeRoadmap.progress)}% through {activeRoadmap.phases.length} phases</p>
              <Link to="/roadmap" className="inline-flex items-center gap-1.5 text-sm font-medium mt-4" style={{ color: 'var(--color-emerald)' }}>
                Continue roadmap <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <p className="text-muted text-sm">Generate a personalized roadmap once you've explored career matches.</p>
          )}
        </div>

        <div className="glass rounded-2xl p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl text-text">Recent Activity</h2>
            <Clock className="h-5 w-5 text-faint" />
          </div>
          {notifications.length ? (
            <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" style={{ background: n.read ? 'var(--color-faint)' : 'var(--color-emerald)' }} />
                  <div>
                    <p className="text-sm text-text">{n.title}</p>
                    <p className="text-xs text-faint">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No activity yet. Start by uploading a resume.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return 'var(--color-emerald)';
  if (score >= 50) return 'var(--color-amber)';
  return 'var(--color-rose)';
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof FileText; label: string; value: string; accent: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--color-surface-3)' }}>
        <Icon className="h-4.5 w-4.5" style={{ color: accent }} />
      </div>
      <p className="font-display text-2xl text-text">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof Compass; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 rounded-xl glass hover:bg-white/5 transition-colors group">
      <Icon className="h-4.5 w-4.5 text-muted group-hover:text-emerald transition-colors" style={{ color: 'var(--color-emerald)' }} />
      <span className="text-sm text-text flex-1">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-faint group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
