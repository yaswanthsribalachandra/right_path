import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Compass, Map, GraduationCap, MessageSquareText,
  BookmarkCheck, Bell, Settings, LogOut, Menu, X, ShieldCheck, Mic,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { getNotifications } from '../lib/api';
import Logo from './ui/Logo';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resume', label: 'Resume Analysis', icon: FileText },
  { to: '/careers', label: 'Career Suggestions', icon: Compass },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/learning', label: 'Learning Progress', icon: GraduationCap },
  { to: '/interview', label: 'Interview Prep', icon: Mic },
  { to: '/chat', label: 'AI Chat', icon: MessageSquareText },
  { to: '/saved', label: 'Saved Careers', icon: BookmarkCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.id).then((n) => setUnread(n.filter((x) => !x.read).length)).catch(() => {});
  }, [user]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const navItems = profile?.role === 'admin' ? [...NAV_ITEMS, { to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck }] : NAV_ITEMS;

  return (
    <div className="min-h-screen mesh-bg grid-overlay flex">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-strong flex items-center justify-between px-4 py-3">
        <Logo to="/dashboard" />
        <button onClick={() => setOpen(!open)} className="text-text p-2">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 shrink-0 z-30 glass-strong flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 pt-7 pb-5 hidden lg:block">
          <Logo to="/dashboard" />
        </div>
        <div className="h-16 lg:hidden" />

        <nav className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  isActive ? 'text-ink' : 'text-muted hover:text-text hover:bg-white/5'
                }`
              }
              style={({ isActive }) => (isActive ? { background: 'var(--color-emerald)' } : {})}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
              <span>{item.label}</span>
              {item.to === '/notifications' && unread > 0 && (
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-rose)', color: '#fff' }}>
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center font-display text-sm shrink-0" style={{ background: 'var(--color-surface-3)', color: 'var(--color-emerald)' }}>
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text truncate">{profile?.full_name || 'Member'}</p>
              <p className="text-xs text-faint truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm text-muted hover:text-text hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
