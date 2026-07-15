import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  FileText, Mail, Phone, Github, Linkedin, Globe, UploadCloud, ArrowRight,
  Trash2, CheckCircle2, AlertCircle, ListChecks,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getResumes, getResume, deleteResume } from '../lib/api';
import type { Resume } from '../lib/types';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ResumeAnalysisPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [params] = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selected, setSelected] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getResumes(user.id).then(async (list) => {
      setResumes(list);
      const idParam = params.get('id');
      if (idParam) {
        const r = list.find((x) => x.id === idParam) || (await getResume(idParam).catch(() => null));
        setSelected(r || list[0] || null);
      } else {
        setSelected(list[0] || null);
      }
    }).finally(() => setLoading(false));
  }, [user, params]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this resume analysis?')) return;
    await deleteResume(id);
    const updated = resumes.filter((r) => r.id !== id);
    setResumes(updated);
    setSelected(updated[0] || null);
    show('Resume deleted.', 'success');
  }

  if (loading) return <DashboardLayout><Loader label="Loading resumes..." /></DashboardLayout>;

  if (!resumes.length) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No resumes analyzed yet"
          description="Upload your resume to get an ATS score, structured field extraction, and skill detection."
          action={
            <Link to="/resume/upload" className="inline-flex items-center gap-2 text-ink font-semibold px-5 py-2.5 rounded-full text-sm mt-2" style={{ background: 'var(--color-emerald)' }}>
              Upload Resume <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Resume Module</p>
          <h1 className="font-display text-3xl text-text">Resume Analysis</h1>
        </div>
        <Link to="/resume/upload" className="inline-flex items-center gap-2 text-ink font-semibold px-5 py-2.5 rounded-full text-sm" style={{ background: 'var(--color-emerald)' }}>
          <UploadCloud className="h-4 w-4" /> Upload New
        </Link>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <div className="glass rounded-2xl p-3 h-fit lg:sticky lg:top-8">
          {resumes.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors ${selected?.id === r.id ? '' : 'hover:bg-white/5'}`}
              style={selected?.id === r.id ? { background: 'var(--color-surface-3)' } : {}}
            >
              <p className="text-sm text-text truncate">{r.file_name}</p>
              <p className="text-xs text-faint mt-0.5">{new Date(r.created_at).toLocaleDateString()} · Score {r.ats_score}</p>
            </button>
          ))}
        </div>

        {selected && <ResumeDetail resume={selected} onDelete={handleDelete} />}
      </div>
    </DashboardLayout>
  );
}

function ResumeDetail({ resume, onDelete }: { resume: Resume; onDelete: (id: string) => void }) {
  const parsed = resume.parsed_data;
  const score = resume.ats_score;
  const color = score >= 75 ? '#34d8a8' : score >= 50 ? '#f5b555' : '#ff6f8f';

  const doughnutData = {
    labels: ['Score', 'Remaining'],
    datasets: [{ data: [score, 100 - score], backgroundColor: [color, 'rgba(255,255,255,0.06)'], borderWidth: 0 }],
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-7 grid sm:grid-cols-[160px_1fr] gap-6 items-center">
        <div className="relative h-40 w-40 mx-auto">
          <Doughnut data={doughnutData} options={{ cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl text-text">{score}</span>
            <span className="text-xs text-faint">/ 100 ATS</span>
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl text-text mb-1">{parsed?.name || 'Candidate'}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-muted mt-3">
            {parsed?.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {parsed.email}</span>}
            {parsed?.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {parsed.phone}</span>}
            {parsed?.github && <a href={parsed.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-text"><Github className="h-3.5 w-3.5" /> GitHub</a>}
            {parsed?.linkedin && <a href={parsed.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-text"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</a>}
            {parsed?.portfolio && <a href={parsed.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-text"><Globe className="h-3.5 w-3.5" /> Portfolio</a>}
          </div>
          <button onClick={() => onDelete(resume.id)} className="mt-4 inline-flex items-center gap-1.5 text-xs text-faint hover:text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete this analysis
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-7">
        <h3 className="font-display text-lg text-text mb-4 flex items-center gap-2"><ListChecks className="h-4.5 w-4.5" style={{ color: 'var(--color-emerald)' }} /> ATS Score Breakdown</h3>
        <div className="space-y-4">
          {resume.ats_breakdown?.map((b) => (
            <div key={b.category}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-text">{b.category}</span>
                <span className="text-sm font-mono text-muted">{b.score}/{b.max}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-3)' }}>
                <div className="h-full rounded-full" style={{ width: `${(b.score / b.max) * 100}%`, background: b.score / b.max > 0.7 ? 'var(--color-emerald)' : b.score / b.max > 0.4 ? 'var(--color-amber)' : 'var(--color-rose)' }} />
              </div>
              <p className="text-xs text-faint mt-1.5">{b.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-7">
          <h3 className="font-display text-lg text-text mb-4">Detected Skills ({parsed?.matchedSkills?.length || 0})</h3>
          {parsed?.matchedSkills?.length ? (
            <div className="flex flex-wrap gap-2">
              {parsed.matchedSkills.map((s) => (
                <span key={s.name} className="text-xs px-3 py-1.5 rounded-full glass text-text">{s.name}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No recognized skill keywords found. Try adding a dedicated Skills section.</p>
          )}
        </div>

        <div className="glass rounded-2xl p-7">
          <h3 className="font-display text-lg text-text mb-4">Improvement Suggestions</h3>
          <ul className="space-y-3">
            {generateSuggestions(resume).map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                {s.type === 'good' ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-emerald)' }} />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-amber)' }} />
                )}
                <span className="text-muted">{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass rounded-2xl p-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-text">Ready for next steps?</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/careers" className="text-sm font-medium px-4 py-2.5 rounded-full text-ink" style={{ background: 'var(--color-emerald)' }}>See Career Matches</Link>
          <Link to="/roadmap" className="text-sm font-medium px-4 py-2.5 rounded-full glass text-text">Generate Roadmap</Link>
          <Link to="/interview" className="text-sm font-medium px-4 py-2.5 rounded-full glass text-text">Practice Interview</Link>
        </div>
      </div>
    </div>
  );
}

function generateSuggestions(resume: Resume): Array<{ type: 'good' | 'warn'; text: string }> {
  const suggestions: Array<{ type: 'good' | 'warn'; text: string }> = [];
  const parsed = resume.parsed_data;
  const breakdown = resume.ats_breakdown || [];

  for (const b of breakdown) {
    const ratio = b.score / b.max;
    if (ratio < 0.6) {
      if (b.category === 'Contact Information') suggestions.push({ type: 'warn', text: 'Add a professional email, phone number, and LinkedIn/GitHub/portfolio links near the top of your resume.' });
      if (b.category === 'Resume Structure') suggestions.push({ type: 'warn', text: 'Include clear section headers for Education, Experience, Projects, and Skills so ATS parsers can extract them correctly.' });
      if (b.category === 'Skill Keyword Density') suggestions.push({ type: 'warn', text: 'List more specific technical and professional skills — aim for 10-15 relevant keywords matched to your target roles.' });
      if (b.category === 'Impact & Action Verbs') suggestions.push({ type: 'warn', text: 'Start bullet points with strong action verbs (Built, Led, Optimized) and quantify results with metrics (e.g., "reduced load time by 40%").' });
      if (b.category === 'Length & Readability') suggestions.push({ type: 'warn', text: 'Aim for 300-900 words (roughly 1-2 pages) — long enough to show depth, short enough to stay scannable.' });
    } else {
      suggestions.push({ type: 'good', text: `${b.category} is strong — ${b.detail}` });
    }
  }
  if (!parsed?.github && !parsed?.portfolio) {
    suggestions.push({ type: 'warn', text: 'Consider adding a GitHub or portfolio link to showcase real project work to recruiters.' });
  }
  return suggestions;
}
