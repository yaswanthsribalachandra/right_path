import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <div className="relative h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-emerald), var(--color-amber))' }}>
        <Sparkles className="h-5 w-5 text-ink" strokeWidth={2.4} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display font-semibold text-[17px] tracking-tight text-text">Pathwright</span>
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-faint">Career Intelligence</span>
      </div>
    </Link>
  );
}
