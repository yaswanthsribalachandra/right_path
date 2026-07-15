import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkCheck, Trash2, DollarSign, TrendingUp, Map as MapIcon } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getSavedCareers, unsaveCareer } from '../lib/api';
import type { SavedCareer } from '../lib/types';

export default function SavedCareersPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [saved, setSaved] = useState<SavedCareer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getSavedCareers(user.id).then(setSaved).finally(() => setLoading(false));
  }, [user]);

  async function handleRemove(id: string) {
    await unsaveCareer(id);
    setSaved(saved.filter((s) => s.id !== id));
    show('Removed from saved careers.', 'success');
  }

  if (loading) return <DashboardLayout><Loader label="Loading saved careers..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Bookmarks</p>
      <h1 className="font-display text-3xl text-text mb-8">Saved Careers</h1>

      {!saved.length ? (
        <EmptyState
          icon={<BookmarkCheck className="h-6 w-6" />}
          title="No saved careers yet"
          description="Bookmark career paths from the Career Suggestions page to track them here."
          action={<Link to="/careers" className="inline-flex items-center gap-2 text-ink font-semibold px-5 py-2.5 rounded-full text-sm mt-2" style={{ background: 'var(--color-emerald)' }}>Explore Careers</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {saved.map((s) => (
            <div key={s.id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{s.careerPath?.icon}</span>
                <button onClick={() => handleRemove(s.id)} className="text-faint hover:text-rose transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
              <h3 className="font-display text-lg text-text mb-1">{s.careerPath?.title}</h3>
              <p className="text-xs text-faint mb-3">{s.careerPath?.category}</p>
              <p className="text-sm text-muted mb-4 line-clamp-2">{s.careerPath?.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted mb-4">
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" style={{ color: 'var(--color-amber)' }} /> ${Number(s.careerPath?.avg_salary_min).toLocaleString()}+</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" style={{ color: 'var(--color-emerald)' }} /> {s.careerPath?.growth_outlook}</span>
              </div>
              <Link to="/roadmap" state={{ careerPathId: s.career_path_id }} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-emerald)' }}>
                <MapIcon className="h-3.5 w-3.5" /> Build roadmap
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
