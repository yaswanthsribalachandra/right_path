import { useEffect, useState, type FormEvent } from 'react';
import { Save, Loader2, Star, MessageSquareText, Sun, Moon } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { updateProfile, submitFeedback } from '../lib/api';

const INTEREST_OPTIONS = ['Web Development', 'Data Science', 'Machine Learning', 'Cloud Computing', 'Cybersecurity', 'Product Management', 'UX/UI Design', 'DevOps', 'Mobile Development', 'Blockchain'];

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ full_name: '', bio: '', career_goal: '', location: '', phone: '', github_url: '', linkedin_url: '', portfolio_url: '' });
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  useEffect(() => {
    localStorage.setItem('theme', themeMode);
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [themeMode]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      career_goal: profile.career_goal || '',
      location: profile.location || '',
      phone: profile.phone || '',
      github_url: profile.github_url || '',
      linkedin_url: profile.linkedin_url || '',
      portfolio_url: profile.portfolio_url || '',
    });
    setInterests(profile.interests || []);
  }, [profile]);

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({ user_id: user.id, ...form, interests });
      await refreshProfile();
      show('Profile updated successfully.', 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleFeedback(e: FormEvent) {
    e.preventDefault();
    if (!user || !rating) return;
    try {
      await submitFeedback({ user_id: user.id, rating, comment, category: 'general' });
      setFeedbackSent(true);
      show('Thanks for your feedback!', 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to submit feedback.', 'error');
    }
  }

  return (
    <DashboardLayout>
      <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Account</p>
      <h1 className="font-display text-3xl text-text mb-8">Settings</h1>

      {/* Appearance Theme Card */}
      <div className="glass rounded-2xl p-7 mb-6 max-w-2xl">
        <h2 className="font-display text-lg text-text mb-1 flex items-center gap-2">
          Appearance
        </h2>
        <p className="text-sm text-muted mb-5">Choose your preferred visual theme for the application.</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              themeMode === 'dark' ? 'border-emerald bg-emerald/5 text-emerald' : 'border-border text-muted hover:text-text hover:bg-white/5'
            }`}
            style={themeMode === 'dark' ? { borderColor: 'var(--color-emerald)' } : {}}
          >
            <Moon className="h-5 w-5" />
            <div className="text-left">
              <p className="text-sm font-semibold">Dark Theme</p>
              <p className="text-xs opacity-75">Sleek, low-light workspace</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              themeMode === 'light' ? 'border-emerald bg-emerald/5 text-emerald' : 'border-border text-muted hover:text-text hover:bg-white/5'
            }`}
            style={themeMode === 'light' ? { borderColor: 'var(--color-emerald)' } : {}}
          >
            <Sun className="h-5 w-5" />
            <div className="text-left">
              <p className="text-sm font-semibold">Light Theme</p>
              <p className="text-xs opacity-75">Clean, bright visualization</p>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="glass rounded-2xl p-7 mb-6 max-w-2xl space-y-5">
        <h2 className="font-display text-lg text-text mb-1">Profile Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="City, Country" />
        </div>
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Career Goal" value={form.career_goal} onChange={(v) => setForm({ ...form, career_goal: v })} placeholder="e.g. Become a Senior Data Scientist within 2 years" />
        <div>
          <label className="text-xs text-muted mb-1.5 block">Bio</label>
          <textarea
            value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
            className="w-full bg-white/5 border rounded-xl p-3.5 text-sm text-text outline-none focus:border-emerald transition-colors resize-none"
            style={{ borderColor: 'var(--color-border)' }}
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="GitHub URL" value={form.github_url} onChange={(v) => setForm({ ...form, github_url: v })} />
          <Field label="LinkedIn URL" value={form.linkedin_url} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
          <Field label="Portfolio URL" value={form.portfolio_url} onChange={(v) => setForm({ ...form, portfolio_url: v })} />
        </div>
        <div>
          <label className="text-xs text-muted mb-2 block">Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((i) => (
              <button
                type="button" key={i} onClick={() => toggleInterest(i)}
                className={`text-xs px-3.5 py-2 rounded-full transition-colors ${interests.includes(i) ? '' : 'glass text-muted hover:text-text'}`}
                style={interests.includes(i) ? { background: 'var(--color-emerald)', color: 'var(--color-ink)', fontWeight: 600 } : {}}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 text-ink font-semibold px-6 py-2.5 rounded-full text-sm disabled:opacity-60" style={{ background: 'var(--color-emerald)' }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
        </button>
      </form>

      <form onSubmit={handleFeedback} className="glass rounded-2xl p-7 max-w-2xl">
        <h2 className="font-display text-lg text-text mb-1 flex items-center gap-2"><MessageSquareText className="h-4.5 w-4.5" style={{ color: 'var(--color-emerald)' }} /> Send Feedback</h2>
        <p className="text-sm text-muted mb-4">Help us improve Pathwright with your thoughts.</p>
        {feedbackSent ? (
          <p className="text-sm" style={{ color: 'var(--color-emerald)' }}>Thanks for sharing your feedback!</p>
        ) : (
          <>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)}>
                  <Star className="h-6 w-6" fill={n <= rating ? 'var(--color-amber)' : 'none'} style={{ color: 'var(--color-amber)' }} />
                </button>
              ))}
            </div>
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
              placeholder="What's working well? What could be better?"
              className="w-full bg-white/5 border rounded-xl p-3.5 text-sm text-text outline-none focus:border-emerald transition-colors resize-none mb-4"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <button type="submit" disabled={!rating} className="text-ink font-semibold px-6 py-2.5 rounded-full text-sm disabled:opacity-40" style={{ background: 'var(--color-emerald)' }}>Submit Feedback</button>
          </>
        )}
      </form>
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted mb-1.5 block">{label}</label>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border rounded-xl py-2.5 px-3.5 text-sm text-text outline-none focus:border-emerald transition-colors"
        style={{ borderColor: 'var(--color-border)' }}
      />
    </div>
  );
}
