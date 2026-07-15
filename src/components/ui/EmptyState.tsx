import type { ReactNode } from 'react';

export default function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
      {icon && <div className="h-14 w-14 rounded-2xl glass flex items-center justify-center text-muted">{icon}</div>}
      <h3 className="font-display text-lg text-text">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
