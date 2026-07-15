import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass, TrendingUp, DollarSign, BookmarkPlus, BookmarkCheck as BookmarkCheckIcon,
  Map as MapIcon, CheckCircle2, XCircle, RefreshCw, Building2, Loader2, ChevronDown,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { matchCareers, getResumes, getSavedCareers, saveCareer, unsaveCareer, getCompanies, getSalaryInsight } from '../lib/api';
import type { CareerMatch, SavedCareer, Company, SalaryInsight } from '../lib/types';

export default function CareerSuggestionsPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedCareer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    const resumes = await getResumes(user.id).catch(() => []);
    if (!resumes.length) { setHasResume(false); setLoading(false); return; }
    setHasResume(true);
    const [result, savedList] = await Promise.all([
      matchCareers({ user_id: user.id }),
      getSavedCareers(user.id).catch(() => []),
    ]);
    setMatches(result.matches);
    setUserSkills(result.userSkills);
    setSaved(savedList);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, [user]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    show('Career matches refreshed.', 'success');
  }

  async function toggleSave(careerPathId: number) {
    if (!user) return;
    const existing = saved.find((s) => s.career_path_id === careerPathId);
    if (existing) {
      await unsaveCareer(existing.id);
      setSaved(saved.filter((s) => s.id !== existing.id));
      show('Removed from saved careers.', 'info');
    } else {
      const created = await saveCareer({ user_id: user.id, career_path_id: careerPathId });
      setSaved([...saved, { ...created, careerPath: matches.find((m) => m.careerPath.id === careerPathId)!.careerPath }]);
      show('Saved to your career list.', 'success');
    }
  }

  const [expanded, setExpanded] = useState<number | null>(null);
  const [companiesCache, setCompaniesCache] = useState<Record<string, Company[]>>({});
  const [salaryCache, setSalaryCache] = useState<Record<number, SalaryInsight | null>>({});
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);

  async function toggleExpand(m: CareerMatch) {
    if (expanded === m.careerPath.id) { setExpanded(null); return; }
    setExpanded(m.careerPath.id);
    setLoadingDetail(m.careerPath.id);
    try {
      if (!companiesCache[m.careerPath.category]) {
        const companies = await getCompanies({ category: m.careerPath.category });
        setCompaniesCache((prev) => ({ ...prev, [m.careerPath.category]: companies }));
      }
      if (!(m.careerPath.id in salaryCache)) {
        const insight = await getSalaryInsight(m.careerPath.title).catch(() => null);
        setSalaryCache((prev) => ({ ...prev, [m.careerPath.id]: insight }));
      }
    } finally {
      setLoadingDetail(null);
    }
  }

  if (loading) return <DashboardLayout><Loader label="Matching your skills against career paths..." /></DashboardLayout>;

  if (!hasResume) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title="Upload a resume to see career matches"
          description="We match your extracted skills against required and nice-to-have skills across dozens of career paths."
          action={<Link to="/resume/upload" className="inline-flex items-center gap-2 text-ink font-semibold px-5 py-2.5 rounded-full text-sm mt-2" style={{ background: 'var(--color-emerald)' }}>Upload Resume</Link>}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Career Intelligence</p>
          <h1 className="font-display text-3xl text-text">Career Suggestions</h1>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-2 text-sm text-text glass rounded-full px-4 py-2 hover:bg-white/5 transition-colors disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <p className="text-muted mb-8">Ranked by skill coverage against your latest resume — {userSkills.length} skills detected.</p>

      <div className="grid gap-4">
        {matches.map((m, i) => {
          const isSaved = saved.some((s) => s.career_path_id === m.careerPath.id);
          return (
            <motion.div
              key={m.careerPath.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{m.careerPath.icon}</span>
                    <h3 className="font-display text-xl text-text">{m.careerPath.title}</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-3)', color: 'var(--color-muted)' }}>{m.careerPath.category}</span>
                  </div>
                  <p className="text-sm text-muted max-w-xl">{m.careerPath.description}</p>
                  <div className="flex items-center gap-5 mt-3 text-sm text-muted">
                    <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" style={{ color: 'var(--color-amber)' }} /> ${Number(m.careerPath.avg_salary_min).toLocaleString()}–${Number(m.careerPath.avg_salary_max).toLocaleString()}</span>
                    <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--color-emerald)' }} /> {m.careerPath.growth_outlook} outlook</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="relative h-16 w-16 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(var(--color-emerald) ${m.matchScore}%, var(--color-surface-3) 0)` }}>
                    <div className="h-12 w-12 rounded-full flex items-center justify-center font-mono text-sm text-text" style={{ background: 'var(--color-surface)' }}>{m.matchScore}%</div>
                  </div>
                  <button onClick={() => toggleSave(m.careerPath.id)} className="text-faint hover:text-text transition-colors">
                    {isSaved ? <BookmarkCheckIcon className="h-5 w-5" style={{ color: 'var(--color-emerald)' }} /> : <BookmarkPlus className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t" style={{ borderColor: 'var(--color-line)' }}>
                <div>
                  <p className="text-xs font-mono uppercase text-faint mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--color-emerald)' }} /> Matched Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...m.matchedRequiredSkills, ...m.matchedNiceToHaveSkills].length ? (
                      [...m.matchedRequiredSkills, ...m.matchedNiceToHaveSkills].map((s) => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,216,168,0.12)', color: 'var(--color-emerald-soft)' }}>{s}</span>
                      ))
                    ) : <span className="text-xs text-faint">None yet</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase text-faint mb-2 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" style={{ color: 'var(--color-rose)' }} /> Skill Gaps</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.missingRequiredSkills.length ? (
                      m.missingRequiredSkills.map((s) => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,111,143,0.12)', color: 'var(--color-rose)' }}>{s}</span>
                      ))
                    ) : <span className="text-xs text-faint">No gaps — you're fully covered!</span>}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <Link to="/roadmap" state={{ careerPathId: m.careerPath.id }} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-emerald)' }}>
                  <MapIcon className="h-3.5 w-3.5" /> Build a roadmap for this path
                </Link>
                <button onClick={() => toggleExpand(m)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text">
                  <Building2 className="h-3.5 w-3.5" /> Companies & Salary
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === m.careerPath.id ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {expanded === m.careerPath.id && (
                <div className="mt-5 pt-5 border-t grid sm:grid-cols-2 gap-5" style={{ borderColor: 'var(--color-line)' }}>
                  {loadingDetail === m.careerPath.id ? (
                    <div className="sm:col-span-2 flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted" /></div>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-mono uppercase text-faint mb-2">Companies Hiring</p>
                        <div className="space-y-2">
                          {(companiesCache[m.careerPath.category] || []).slice(0, 4).map((c) => (
                            <div key={c.id} className="flex items-center justify-between text-sm">
                              <span className="text-text">{c.name}</span>
                              <span className="text-xs text-faint">${Number(c.avg_salary).toLocaleString()}</span>
                            </div>
                          ))}
                          {!(companiesCache[m.careerPath.category] || []).length && <p className="text-xs text-faint">No company data for this category yet.</p>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-mono uppercase text-faint mb-2">Salary Insight</p>
                        {salaryCache[m.careerPath.id]?.overallRange ? (
                          <div>
                            <p className="font-display text-lg text-text">
                              ${salaryCache[m.careerPath.id]!.overallRange!.min.toLocaleString()} – ${salaryCache[m.careerPath.id]!.overallRange!.max.toLocaleString()}
                            </p>
                            <div className="mt-2 space-y-1">
                              {salaryCache[m.careerPath.id]!.byExperienceLevel.map((lvl) => (
                                <div key={lvl.level} className="flex items-center justify-between text-xs text-muted">
                                  <span>{lvl.level}</span>
                                  <span>${lvl.min.toLocaleString()}–${lvl.max.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : <p className="text-xs text-faint">No salary data matched for this role.</p>}
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
