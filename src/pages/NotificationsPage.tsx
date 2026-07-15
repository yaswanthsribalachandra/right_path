import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../lib/api';
import type { AppNotification } from '../lib/types';

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle };
const COLORS = { info: 'var(--color-ice)', success: 'var(--color-emerald)', warning: 'var(--color-amber)', error: 'var(--color-rose)' };

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.id).then(setItems).finally(() => setLoading(false));
  }, [user]);

  async function markRead(id: string) {
    await markNotificationRead(id, true);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAll() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function remove(id: string) {
    await deleteNotification(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  if (loading) return <DashboardLayout><Loader label="Loading notifications..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Alerts</p>
          <h1 className="font-display text-3xl text-text">Notifications</h1>
        </div>
        {items.some((i) => !i.read) && (
          <button onClick={markAll} className="inline-flex items-center gap-2 text-sm text-text glass rounded-full px-4 py-2 hover:bg-white/5">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {!items.length ? (
        <EmptyState icon={<Bell className="h-6 w-6" />} title="No notifications yet" description="You'll see updates here as you use the platform — resume analyses, roadmap generation, and interview results." />
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <div key={n.id} className={`glass rounded-xl p-4 flex items-start gap-3 ${!n.read ? '' : 'opacity-60'}`}>
                <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: COLORS[n.type] }} />
                <div className="flex-1">
                  <p className="text-sm text-text">{n.title}</p>
                  <p className="text-sm text-muted mt-0.5">{n.message}</p>
                  <p className="text-xs text-faint mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && <button onClick={() => markRead(n.id)} className="text-xs text-faint hover:text-text">Mark read</button>}
                  <button onClick={() => remove(n.id)} className="text-faint hover:text-rose"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
