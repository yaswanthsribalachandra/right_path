export default function Loader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-9 w-9 rounded-full animate-spin" style={{ border: '3px solid rgba(52,216,168,0.15)', borderTopColor: 'var(--color-emerald)' }} />
      <p className="text-sm font-mono text-muted">{label}</p>
    </div>
  );
}
