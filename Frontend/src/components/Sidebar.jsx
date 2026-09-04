import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowUpRight, ClipboardList,
  User, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { getInitials } from '../lib/utils.js';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send',         icon: ArrowUpRight,    label: 'Send Money' },
  { to: '/transactions', icon: ClipboardList,   label: 'Transactions' },
  { to: '/profile',      icon: User,            label: 'Profile' },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-paper border-r border-line">
      {/* Wordmark */}
      <div className="flex items-baseline gap-2 px-8 py-8">
        <span className="text-2xl serif text-ink">Kuber</span>
        <span className="text-2xl serif-italic text-ink-3">.</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-2.5 text-sm font-medium
               transition-colors duration-200 ease-out-expo ${
                 isActive
                   ? 'text-ink'
                   : 'text-ink-4 hover:text-ink'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`h-[1px] transition-all duration-200 ease-out-expo ${
                    isActive ? 'w-4 bg-accent' : 'w-0 bg-transparent group-hover:w-2 group-hover:bg-ink-4'
                  }`}
                  aria-hidden
                />
                <Icon className="h-4 w-4 flex-shrink-0 opacity-70" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-line px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-xs font-medium text-ink flex-shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
            <p className="text-xs text-ink-4 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 text-xs text-ink-4 hover:text-accent transition-colors duration-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
