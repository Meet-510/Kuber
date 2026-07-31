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

  // Connect socket and set up real-time event handlers
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    const handleTransferReceived = ({ transaction, newBalance, senderName, amount, notification }) => {
      toast.success(`💰 ${senderName} sent you $${amount} CAD!`, { duration: 5000 });
      client.refetchQueries({ include: [GET_ME, 'GetTransactions', 'GetNotifications'] });
    };

    const handleTransferSent = ({ transaction, newBalance, notification }) => {
      toast.success(`✅ Transfer sent successfully`, { duration: 3000 });
      client.refetchQueries({ include: [GET_ME, 'GetTransactions', 'GetNotifications'] });
    };

    socket.on('transfer_received', handleTransferReceived);
    socket.on('transfer_sent', handleTransferSent);

    return () => {
      socket.off('transfer_received', handleTransferReceived);
      socket.off('transfer_sent', handleTransferSent);
    };
  }, [token]);

  // Close notification panel on outside click
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
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex h-full w-64 flex-col">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3 lg:px-6">
          <button
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200 lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 lg:flex-none" />

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1f5c3d] text-[10px] font-bold text-[#f2f0e9]">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/50 z-50 overflow-hidden animate-fade-in">
                <NotificationPanel onClose={() => setNotifOpen(false)} />
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
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
