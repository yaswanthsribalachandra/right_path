import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import supabase from '../lib/supabase';
import Logo from '../components/ui/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login' });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <div className="min-h-screen mesh-bg grid-overlay flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo to="/" /></div>
        <div className="glass-strong rounded-3xl p-8">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4" style={{ color: 'var(--color-emerald)' }} />
            <p className="text-xs font-mono uppercase tracking-wider text-faint">Account recovery</p>
          </div>
          <h1 className="font-display text-2xl text-text mb-2">Reset your password</h1>
          <p className="text-sm text-muted mb-6">We&apos;ll email you a secure link (a One-Time verification flow) to reset your password.</p>

          {sent ? (
            <div className="text-sm rounded-xl px-4 py-4 flex items-start gap-3" style={{ background: 'rgba(52,216,168,0.1)', border: '1px solid rgba(52,216,168,0.25)' }}>
              <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'var(--color-emerald)' }} />
              <p className="text-text">If an account exists for <strong>{email}</strong>, a reset link (OTP) has been sent. Check your inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(255,111,143,0.1)', color: 'var(--color-rose)', border: '1px solid rgba(255,111,143,0.25)' }}>{error}</div>}
              <div>
                <label className="text-xs text-muted mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text outline-none focus:border-emerald transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-ink font-semibold py-2.5 rounded-xl transition-transform hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'var(--color-emerald)' }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Reset Link <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted mt-6">
            Remembered your password? <Link to="/login" className="font-medium" style={{ color: 'var(--color-emerald)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
