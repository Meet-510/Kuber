import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { connectSocket } from '../lib/socket.js';
import { client } from '../lib/apolloClient.js';
import { GET_ME } from '../graphql/queries.js';
import { useInactivityLogout } from '../hooks/useInactivityLogout.js';
import Sidebar from './Sidebar.jsx';
import NotificationPanel from './NotificationPanel.jsx';
import InactivityModal from './InactivityModal.jsx';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { token, logout } = useAuthStore();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const { data } = useQuery(GET_ME, { skip: !token });
  const unread = data?.getMe?.unreadNotifications ?? 0;

  const handleTimeoutLogout = useCallback(
    async (reason) => {
      await logout();
      if (reason === 'inactivity') toast('Signed out — inactive too long', { icon: '⏱️' });
      navigate('/login', { replace: true });
    },
    [logout, navigate]
  );

  const { warningOpen, secondsLeft, dismissWarning } = useInactivityLogout({
    enabled: !!token,
    onLogout: handleTimeoutLogout,
  });

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    const handleTransferReceived = ({ senderName, amount }) => {
      toast.success(`${senderName} sent you $${amount} CAD`, { duration: 5000 });
      client.refetchQueries({ include: [GET_ME, 'GetTransactions', 'GetNotifications'] });
    };

    const handleTransferSent = () => {
      toast.success('Transfer sent successfully', { duration: 3000 });
      client.refetchQueries({ include: [GET_ME, 'GetTransactions', 'GetNotifications'] });
    };

    socket.on('transfer_received', handleTransferReceived);
    socket.on('transfer_sent', handleTransferSent);

    return () => {
      socket.off('transfer_received', handleTransferReceived);
      socket.off('transfer_sent', handleTransferSent);
    };
  }, [token]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex h-full w-64 flex-col">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — hairline only, no fill */}
        <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4 lg:px-10">
          <button
            className="rounded-full p-2 text-ink-4 hover:text-ink transition-colors lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden serif text-xl text-ink">Kuber</div>
          <div className="flex-1 lg:flex-none" />

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-full p-2 text-ink-4 hover:text-ink transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.5} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-accent" />
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 surface z-50 overflow-hidden animate-fade-in">
                <NotificationPanel onClose={() => setNotifOpen(false)} />
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-6 py-10 lg:px-10 lg:py-16">{children}</main>
      </div>

      <InactivityModal
        open={warningOpen}
        secondsLeft={secondsLeft}
        onStay={dismissWarning}
        onLogout={() => handleTimeoutLogout('user')}
      />
    </div>
  );
}
