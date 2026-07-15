import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js';
import {
  ShieldCheck, Users, FileText, Map as MapIcon, Mic, MessageSquareText,
  Star, Activity, TrendingUp,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import { getAdminStats, type AdminStats } from '../lib/api';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Loader label="Loading admin analytics..." /></DashboardLayout>;
  if (!stats) return <DashboardLayout><p className="text-muted">Failed to load admin data.</p></DashboardLayout>;

  const activityByDay: Record<string, number> = {};
  for (const log of stats.recentActivity) {
    const day = new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    activityByDay[day] = (activityByDay[day] || 0) + 1;
  }
  const days = Object.keys(activityByDay).reverse();
  const chartData = {
    labels: days.length ? days : ['No data'],
    datasets: [{
      label: 'Activity Events',
      data: days.length ? days.map((d) => activityByDay[d]) : [0],
      borderColor: '#34d8a8',
      backgroundColor: 'rgba(52,216,168,0.15)',
      fill: true,
      tension: 0.4,
    }],
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-5 w-5" style={{ color: 'var(--color-emerald)' }} />
        <p className="font-mono text-xs uppercase tracking-widest text-faint">Admin Only</p>
      </div>
      <h1 className="font-display text-3xl text-text mb-8">Platform Analytics</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={String(stats.totalUsers)} accent="var(--color-emerald)" />
        <StatCard icon={FileText} label="Resumes Analyzed" value={String(stats.totalResumes)} accent="var(--color-amber)" />
        <StatCard icon={MapIcon} label="Roadmaps Generated" value={String(stats.totalRoadmaps)} accent="var(--color-rose)" />
        <StatCard icon={Mic} label="Mock Interviews" value={String(stats.totalMockInterviews)} accent="var(--color-ice)" />
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={MessageSquareText} label="Chat Messages" value={String(stats.totalChatMessages)} accent="var(--color-emerald)" />
        <StatCard icon={TrendingUp} label="Avg ATS Score" value={`${stats.avgAtsScore}/100`} accent="var(--color-amber)" />
        <StatCard icon={Star} label="Avg Feedback Rating" value={`${stats.avgFeedbackRating}/5`} accent="var(--color-rose)" />
      </div>

      <div className="glass rounded-2xl p-7 mb-6">
        <h3 className="font-display text-lg text-text mb-5 flex items-center gap-2"><Activity className="h-4.5 w-4.5" style={{ color: 'var(--color-emerald)' }} /> Recent Platform Activity</h3>
        <div className="h-56">
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: '#8b96b5' } }, y: { grid: { color: '#1b2440' }, ticks: { color: '#8b96b5' } } }, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-7">
          <h3 className="font-display text-lg text-text mb-5">Recent Feedback</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
            {stats.recentFeedback.length ? stats.recentFeedback.map((f) => (
              <div key={f.id} className="glass rounded-xl p-4">
                <div className="flex items-center gap-1 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5" fill={i < f.rating ? 'var(--color-amber)' : 'none'} style={{ color: 'var(--color-amber)' }} />)}
                </div>
                <p className="text-sm text-muted">{f.comment || '(no comment provided)'}</p>
                <p className="text-xs text-faint mt-1">{new Date(f.created_at).toLocaleDateString()}</p>
              </div>
            )) : <p className="text-sm text-faint">No feedback submitted yet.</p>}
          </div>
        </div>

        <div className="glass rounded-2xl p-7">
          <h3 className="font-display text-lg text-text mb-5">Recent Signups</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
            {stats.recentUsers.length ? stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center font-display text-sm shrink-0" style={{ background: 'var(--color-surface-3)', color: 'var(--color-emerald)' }}>
                  {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{u.full_name || 'Member'}</p>
                  <p className="text-xs text-faint truncate">{u.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full glass text-muted shrink-0">{u.role}</span>
              </div>
            )) : <p className="text-sm text-faint">No users yet.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string; accent: string }) {
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
