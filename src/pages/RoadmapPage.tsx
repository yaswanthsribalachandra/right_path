import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Map as MapIcon, Plus, Trash2, BookOpen, Award, Rocket, ChevronDown, Loader2,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getRoadmaps, createRoadmap, deleteRoadmap, getCareerPaths, addLearningItem, getLearningProgress, updateLearningItem } from '../lib/api';
import type { Roadmap, CareerPath, LearningProgressItem } from '../lib/types';

export default function RoadmapPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const location = useLocation();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [progressItems, setProgressItems] = useState<LearningProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openPhase, setOpenPhase] = useState<number>(0);

  async function loadAll() {
    if (!user) return;
    const [rm, cp] = await Promise.all([getRoadmaps(user.id), getCareerPaths()]);
    setRoadmaps(rm);
    setCareerPaths(cp);
    if (rm.length) {
      setSelectedRoadmap(rm[0]);
      const prog = await getLearningProgress(user.id, rm[0].id);
      setProgressItems(prog);
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [user]);

  useEffect(() => {
    const stateCareerPathId = (location.state as { careerPathId?: number } | null)?.careerPathId;
    if (stateCareerPathId && !loading) {
      setPickerOpen(true);
    }
  }, [location.state, loading]);

  async function selectRoadmap(rm: Roadmap) {
    setSelectedRoadmap(rm);
    if (!user) return;
    const prog = await getLearningProgress(user.id, rm.id);
    setProgressItems(prog);
  }

  async function handleGenerate(careerPathId: number) {
    if (!user) return;
    setGenerating(true);
    try {
      const rm = await createRoadmap({ user_id: user.id, career_path_id: careerPathId });
      setRoadmaps([rm, ...roadmaps]);
      setSelectedRoadmap(rm);
      setProgressItems([]);
      setPickerOpen(false);
      show('Roadmap generated successfully!', 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to generate roadmap.', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this roadmap?')) return;
    await deleteRoadmap(id);
    const updated = roadmaps.filter((r) => r.id !== id);
    setRoadmaps(updated);
    setSelectedRoadmap(updated[0] || null);
    show('Roadmap deleted.', 'success');
  }

  async function toggleItem(title: string, type: string) {
    if (!user || !selectedRoadmap) return;
    let item = progressItems.find((p) => p.item_title === title);
    if (!item) {
      item = await addLearningItem({ user_id: user.id, roadmap_id: selectedRoadmap.id, item_title: title, item_type: type });
      setProgressItems([...progressItems, item]);
    }
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    const updated = await updateLearningItem({ id: item.id, status: newStatus });
    setProgressItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    const refreshed = await getRoadmaps(user.id);
    setRoadmaps(refreshed);
    const rm = refreshed.find((r) => r.id === selectedRoadmap.id);
    if (rm) setSelectedRoadmap(rm);
  }

  function isDone(title: string) {
    return progressItems.some((p) => p.item_title === title && p.status === 'completed');
  }

  if (loading) return <DashboardLayout><Loader label="Loading roadmaps..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Roadmap Generator</p>
          <h1 className="font-display text-3xl text-text">Your Learning Roadmap</h1>
        </div>
        <button onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-2 text-ink font-semibold px-5 py-2.5 rounded-full text-sm" style={{ background: 'var(--color-emerald)' }}>
          <Plus className="h-4 w-4" /> New Roadmap
        </button>
      </div>

      {pickerOpen && (
        <div className="glass-strong rounded-2xl p-6 mb-8">
          <h3 className="font-display text-lg text-text mb-4">Choose a career path</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto no-scrollbar">
            {careerPaths.map((cp) => (
              <button
                key={cp.id}
                disabled={generating}
                onClick={() => handleGenerate(cp.id)}
                className="text-left glass rounded-xl p-4 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <span className="text-xl">{cp.icon}</span>
                <p className="text-sm text-text mt-1.5 font-medium">{cp.title}</p>
                <p className="text-xs text-faint">{cp.category}</p>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            {generating && <span className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Generating roadmap...</span>}
            <button onClick={() => setPickerOpen(false)} className="text-sm text-faint hover:text-text ml-auto">Cancel</button>
          </div>
        </div>
      )}

      {!roadmaps.length && !pickerOpen ? (
        <EmptyState
          icon={<MapIcon className="h-6 w-6" />}
          title="No roadmaps yet"
          description="Pick a career path to generate a phased roadmap with courses, certifications, and projects."
          action={<button onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-2 text-ink font-semibold px-5 py-2.5 rounded-full text-sm mt-2" style={{ background: 'var(--color-emerald)' }}>Generate Roadmap</button>}
        />
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <div className="glass rounded-2xl p-3 h-fit lg:sticky lg:top-8">
            {roadmaps.map((r) => (
              <div key={r.id} className="mb-1 group relative">
                <button
                  onClick={() => selectRoadmap(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl pr-9 transition-colors ${selectedRoadmap?.id === r.id ? '' : 'hover:bg-white/5'}`}
                  style={selectedRoadmap?.id === r.id ? { background: 'var(--color-surface-3)' } : {}}
                >
                  <p className="text-sm text-text truncate">{r.title}</p>
                  <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'var(--color-line)' }}>
                    <div className="h-full rounded-full" style={{ width: `${r.progress}%`, background: 'var(--color-emerald)' }} />
                  </div>
                </button>
                <button onClick={() => handleDelete(r.id)} className="absolute right-2 top-3 text-faint hover:text-rose opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {selectedRoadmap && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6">
                <h2 className="font-display text-xl text-text mb-2">{selectedRoadmap.title}</h2>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-3)' }}>
                    <div className="h-full rounded-full" style={{ width: `${selectedRoadmap.progress}%`, background: 'var(--color-emerald)' }} />
                  </div>
                  <span className="text-sm font-mono text-muted">{Math.round(selectedRoadmap.progress)}%</span>
                </div>
              </div>

              {selectedRoadmap.phases.map((phase, idx) => (
                <motion.div key={phase.phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl overflow-hidden">
                  <button onClick={() => setOpenPhase(openPhase === idx ? -1 : idx)} className="w-full flex items-center justify-between px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full flex items-center justify-center font-mono text-sm shrink-0" style={{ background: 'var(--color-surface-3)', color: 'var(--color-emerald)' }}>{phase.phase}</span>
                      <div className="text-left">
                        <p className="font-medium text-text">{phase.title}</p>
                        <p className="text-xs text-faint">{phase.duration}</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted transition-transform ${openPhase === idx ? 'rotate-180' : ''}`} />
                  </button>

                  {openPhase === idx && (
                    <div className="px-6 pb-6 space-y-5">
                      {phase.skills.length > 0 && (
                        <div>
                          <p className="text-xs font-mono uppercase text-faint mb-2">Skills to Build</p>
                          <div className="flex flex-wrap gap-2">
                            {phase.skills.map((s) => (
                              <label key={s} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full cursor-pointer" style={{ background: isDone(s) ? 'rgba(52,216,168,0.15)' : 'var(--color-surface-3)', color: isDone(s) ? 'var(--color-emerald)' : 'var(--color-muted)' }}>
                                <input type="checkbox" checked={isDone(s)} onChange={() => toggleItem(s, 'skill')} className="accent-emerald h-3 w-3" />
                                {s}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {phase.courses.length > 0 && (
                        <div>
                          <p className="text-xs font-mono uppercase text-faint mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Courses</p>
                          <div className="space-y-2">
                            {phase.courses.map((c) => (
                              <label key={c.id} className="flex items-center gap-3 text-sm p-2.5 rounded-lg cursor-pointer hover:bg-white/5">
                                <input type="checkbox" checked={isDone(c.title)} onChange={() => toggleItem(c.title, 'course')} className="accent-emerald h-4 w-4 shrink-0" />
                                <span className={isDone(c.title) ? 'text-faint line-through' : 'text-text'}>{c.title}</span>
                                <span className="text-xs text-faint ml-auto shrink-0">{c.provider}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {phase.certifications.length > 0 && (
                        <div>
                          <p className="text-xs font-mono uppercase text-faint mb-2 flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> Certifications</p>
                          <div className="space-y-2">
                            {phase.certifications.map((c) => (
                              <label key={c.id} className="flex items-center gap-3 text-sm p-2.5 rounded-lg cursor-pointer hover:bg-white/5">
                                <input type="checkbox" checked={isDone(c.title)} onChange={() => toggleItem(c.title, 'certification')} className="accent-emerald h-4 w-4 shrink-0" />
                                <span className={isDone(c.title) ? 'text-faint line-through' : 'text-text'}>{c.title}</span>
                                <span className="text-xs text-faint ml-auto shrink-0">{c.provider}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {phase.projects.length > 0 && (
                        <div>
                          <p className="text-xs font-mono uppercase text-faint mb-2 flex items-center gap-1.5"><Rocket className="h-3.5 w-3.5" /> Projects</p>
                          <div className="space-y-2">
                            {phase.projects.map((p) => (
                              <label key={p.id} className="flex items-start gap-3 text-sm p-2.5 rounded-lg cursor-pointer hover:bg-white/5">
                                <input type="checkbox" checked={isDone(p.title)} onChange={() => toggleItem(p.title, 'project')} className="accent-emerald h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                  <span className={isDone(p.title) ? 'text-faint line-through' : 'text-text'}>{p.title}</span>
                                  <p className="text-xs text-faint mt-0.5">{p.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
