import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { GraduationCap, CheckCircle2, Clock, ListTodo, Map as MapIcon } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { getLearningProgress, getRoadmaps } from '../lib/api';
import type { LearningProgressItem, Roadmap } from '../lib/types';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function LearningProgressPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LearningProgressItem[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getLearningProgress(user.id), getRoadmaps(user.id)])
      .then(([i, r]) => { setItems(i); setRoadmaps(r); })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <DashboardLayout><Loader label="Loading progress..." /></DashboardLayout>;

  if (!roadmaps.length) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title="No learning progress tracked yet"
          description="Generate a roadmap and start checking off skills, courses, certifications, and projects."
          action={<Link to="/roadmap" className="inline-flex items-center gap-2 text-ink font-semibold px-5 py-2.5 rounded-full text-sm mt-2" style={{ background: 'var(--color-emerald)' }}><MapIcon className="h-4 w-4" /> Go to Roadmap</Link>}
        />
      </DashboardLayout>
    );
  }

  const completed = items.filter((i) => i.status === 'completed').length;
  const pending = items.length - completed;

  const byType: Record<string, { completed: number; total: number }> = {};
  for (const item of items) {
    byType[item.item_type] = byType[item.item_type] || { completed: 0, total: 0 };
    byType[item.item_type].total++;
    if (item.status === 'completed') byType[item.item_type].completed++;
  }

  const chartData = {
    labels: Object.keys(byType).map((k) => k.charAt(0).toUpperCase() + k.slice(1) + 's'),
    datasets: [
      { label: 'Completed', data: Object.values(byType).map((v) => v.completed), backgroundColor: '#34d8a8', borderRadius: 6 },
      { label: 'Pending', data: Object.values(byType).map((v) => v.total - v.completed), backgroundColor: '#253150', borderRadius: 6 },
    ],
  };

  return (
    <DashboardLayout>
      <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Progress Tracking</p>
      <h1 className="font-display text-3xl text-text mb-8">Learning Progress</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <CheckCircle2 className="h-5 w-5 mb-3" style={{ color: 'var(--color-emerald)' }} />
          <p className="font-display text-2xl text-text">{completed}</p>
          <p className="text-xs text-muted">Items Completed</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <Clock className="h-5 w-5 mb-3" style={{ color: 'var(--color-amber)' }} />
          <p className="font-display text-2xl text-text">{pending}</p>
          <p className="text-xs text-muted">Items Remaining</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <ListTodo className="h-5 w-5 mb-3" style={{ color: 'var(--color-ice)' }} />
          <p className="font-display text-2xl text-text">{roadmaps.length}</p>
          <p className="text-xs text-muted">Active Roadmaps</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-7 mb-6">
        <h3 className="font-display text-lg text-text mb-5">Progress by Type</h3>
        <div className="h-64">
          <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false }, ticks: { color: '#8b96b5' } }, y: { stacked: true, grid: { color: '#1b2440' }, ticks: { color: '#8b96b5' } } }, plugins: { legend: { labels: { color: '#e7ecf7' } } } }} />
        </div>
      </div>

      <div className="glass rounded-2xl p-7">
        <h3 className="font-display text-lg text-text mb-5">Roadmap Completion</h3>
        <div className="space-y-4">
          {roadmaps.map((r) => (
            <div key={r.id}>
              <div className="flex items-center justify-between mb-1.5">
                <Link to="/roadmap" className="text-sm text-text hover:underline">{r.title}</Link>
                <span className="text-sm font-mono text-muted">{Math.round(r.progress)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-3)' }}>
                <div className="h-full rounded-full" style={{ width: `${r.progress}%`, background: 'var(--color-emerald)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
