import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, ChevronRight, ChevronLeft, Loader2, CheckCircle2, XCircle, Timer,
  BookOpen, Play, RotateCcw,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getInterviewQuestions, startMockInterview, submitMockInterview, getMockInterviews } from '../lib/api';
import type { InterviewQuestion, MockInterview } from '../lib/types';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'UX Designer', 'Data Analyst', 'Machine Learning Engineer'];

type Mode = 'browse' | 'setup' | 'active' | 'results';

export default function InterviewPrepPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [mode, setMode] = useState<Mode>('browse');
  const [allQuestions, setAllQuestions] = useState<InterviewQuestion[]>([]);
  const [history, setHistory] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(ROLES[0]);
  const [activeQuestions, setActiveQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MockInterview | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getInterviewQuestions(), getMockInterviews(user.id)])
      .then(([q, h]) => { setAllQuestions(q); setHistory(h); })
      .finally(() => setLoading(false));
  }, [user]);

  async function beginInterview() {
    setSubmitting(true);
    try {
      const { questions } = await startMockInterview({ role, count: 6 });
      setActiveQuestions(questions);
      setAnswers(new Array(questions.length).fill(''));
      setCurrentIdx(0);
      setMode('active');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to start interview.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function finishInterview() {
    if (!user) return;
    setSubmitting(true);
    try {
      const submitted = await submitMockInterview({ user_id: user.id, role, questions: activeQuestions, answers });
      setResult(submitted);
      setHistory([submitted, ...history]);
      setMode('results');
      show('Mock interview scored!', 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to submit interview.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <DashboardLayout><Loader label="Loading interview prep..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Interview Prep</p>
      <h1 className="font-display text-3xl text-text mb-8">Interview Preparation & Mock Interview</h1>

      {mode === 'browse' && (
        <div className="space-y-8">
          <div className="glass-strong rounded-2xl p-7 flex flex-wrap items-center justify-between gap-5">
            <div>
              <h2 className="font-display text-xl text-text mb-1">Start a timed mock interview</h2>
              <p className="text-sm text-muted">6 role-specific questions, automatically scored with feedback.</p>
            </div>
            <button onClick={() => setMode('setup')} className="inline-flex items-center gap-2 text-ink font-semibold px-6 py-3 rounded-full text-sm" style={{ background: 'linear-gradient(90deg, var(--color-emerald), var(--color-amber))' }}>
              <Play className="h-4 w-4" /> Start Mock Interview
            </button>
          </div>

          {history.length > 0 && (
            <div>
              <h3 className="font-display text-lg text-text mb-4">Your Interview History</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((h) => (
                  <div key={h.id} className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text">{h.role}</span>
                      <span className="font-mono text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-3)', color: h.score >= 7 ? 'var(--color-emerald)' : h.score >= 5 ? 'var(--color-amber)' : 'var(--color-rose)' }}>{h.score}/10</span>
                    </div>
                    <p className="text-xs text-faint">{new Date(h.created_at).toLocaleDateString()}</p>
                    {h.feedback?.strengths?.length > 0 && (
                      <p className="text-xs text-muted mt-2">Strong in: {h.feedback.strengths.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-display text-lg text-text mb-4 flex items-center gap-2"><BookOpen className="h-4.5 w-4.5" style={{ color: 'var(--color-emerald)' }} /> Question Bank ({allQuestions.length})</h3>
            <div className="space-y-3">
              {allQuestions.map((q) => (
                <details key={q.id} className="glass rounded-xl p-4 group">
                  <summary className="cursor-pointer text-sm text-text flex items-center justify-between list-none">
                    <span>{q.question}</span>
                    <span className="text-xs text-faint font-mono shrink-0 ml-3">{q.role} · {q.difficulty}</span>
                  </summary>
                  <p className="text-sm text-muted mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-line)' }}>{q.answer_guidance}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'setup' && (
        <div className="glass-strong rounded-2xl p-8 max-w-lg">
          <h2 className="font-display text-xl text-text mb-5">Choose your target role</h2>
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`text-sm px-4 py-3 rounded-xl text-left transition-colors ${role === r ? '' : 'glass hover:bg-white/5'}`}
                style={role === r ? { background: 'var(--color-emerald)', color: 'var(--color-ink)', fontWeight: 600 } : {}}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('browse')} className="text-sm text-faint hover:text-text px-4 py-2.5">Cancel</button>
            <button onClick={beginInterview} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 text-ink font-semibold py-3 rounded-xl disabled:opacity-60" style={{ background: 'var(--color-emerald)' }}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Begin Interview <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      )}

      {mode === 'active' && activeQuestions.length > 0 && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-mono text-muted flex items-center gap-2"><Timer className="h-4 w-4" /> Question {currentIdx + 1} of {activeQuestions.length}</span>
            <span className="text-xs px-2.5 py-1 rounded-full glass text-muted">{activeQuestions[currentIdx].category}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-8" style={{ background: 'var(--color-surface-3)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${((currentIdx + 1) / activeQuestions.length) * 100}%`, background: 'var(--color-emerald)' }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-display text-2xl text-text mb-6">{activeQuestions[currentIdx].question}</h2>
              <textarea
                value={answers[currentIdx]}
                onChange={(e) => setAnswers((a) => a.map((v, i) => (i === currentIdx ? e.target.value : v)))}
                placeholder="Type your answer here as if you were speaking in a real interview..."
                rows={8}
                className="w-full bg-white/5 border rounded-2xl p-5 text-sm text-text outline-none focus:border-emerald transition-colors resize-none"
                style={{ borderColor: 'var(--color-border)' }}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-text disabled:opacity-30 px-4 py-2.5"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {currentIdx < activeQuestions.length - 1 ? (
              <button onClick={() => setCurrentIdx((i) => i + 1)} className="flex items-center gap-1.5 text-ink font-semibold px-5 py-2.5 rounded-full text-sm" style={{ background: 'var(--color-emerald)' }}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={finishInterview} disabled={submitting} className="flex items-center gap-1.5 text-ink font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-60" style={{ background: 'linear-gradient(90deg, var(--color-emerald), var(--color-amber))' }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit for Scoring'}
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'results' && result && (
        <div className="max-w-2xl space-y-6">
          <div className="glass-strong rounded-2xl p-8 text-center">
            <p className="font-mono text-xs uppercase text-faint mb-3">Overall Score</p>
            <p className="font-display text-5xl mb-2" style={{ color: result.score >= 7 ? 'var(--color-emerald)' : result.score >= 5 ? 'var(--color-amber)' : 'var(--color-rose)' }}>{result.score}/10</p>
            <p className="text-muted text-sm">{result.role} Mock Interview</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-mono uppercase text-faint mb-3 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--color-emerald)' }} /> Strengths</p>
              {result.feedback.strengths.length ? (
                <div className="flex flex-wrap gap-1.5">{result.feedback.strengths.map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,216,168,0.12)', color: 'var(--color-emerald-soft)' }}>{s}</span>)}</div>
              ) : <p className="text-xs text-faint">Keep practicing to build consistent strengths.</p>}
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-mono uppercase text-faint mb-3 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" style={{ color: 'var(--color-rose)' }} /> Focus Areas</p>
              {result.feedback.improvementAreas.length ? (
                <div className="flex flex-wrap gap-1.5">{result.feedback.improvementAreas.map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,111,143,0.12)', color: 'var(--color-rose)' }}>{s}</span>)}</div>
              ) : <p className="text-xs text-faint">No major weak spots detected!</p>}
            </div>
          </div>

          <div className="space-y-3">
            {result.feedback.detailed.map((d, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-text">{d.question}</p>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: 'var(--color-surface-3)', color: d.score >= 7 ? 'var(--color-emerald)' : d.score >= 5 ? 'var(--color-amber)' : 'var(--color-rose)' }}>{d.score}/10</span>
                </div>
                <p className="text-xs text-muted mb-2 italic">"{d.answer || '(no answer given)'}"</p>
                <p className="text-xs text-faint">{d.feedback}</p>
              </div>
            ))}
          </div>

          <button onClick={() => { setMode('browse'); setResult(null); }} className="inline-flex items-center gap-2 text-sm text-text glass rounded-full px-5 py-2.5 hover:bg-white/5">
            <RotateCcw className="h-4 w-4" /> Back to Interview Prep
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
