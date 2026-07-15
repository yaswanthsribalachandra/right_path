import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Logo from '../components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen mesh-bg grid-overlay flex flex-col items-center justify-center px-5 text-center">
      <div className="mb-8"><Logo to="/" /></div>
      <Compass className="h-14 w-14 mb-6 animate-pulse-glow" style={{ color: 'var(--color-emerald)' }} />
      <h1 className="font-display text-6xl text-text mb-3">404</h1>
      <p className="text-muted max-w-sm mb-8">Looks like this path isn&apos;t on your roadmap. Let&apos;s get you back on track.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-ink font-semibold px-6 py-3 rounded-full transition-transform hover:scale-105"
        style={{ background: 'var(--color-emerald)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
    </div>
  );
}
