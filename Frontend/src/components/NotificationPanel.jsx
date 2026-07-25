import { useQuery, useMutation } from '@apollo/client';
import { Bell, X, CheckCheck } from 'lucide-react';
import { GET_NOTIFICATIONS, GET_ME } from '../graphql/queries.js';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from '../graphql/mutations.js';
import { formatRelativeTime, getNotificationIcon } from '../lib/utils.js';

export default function NotificationPanel({ onClose }) {
  const { data, refetch } = useQuery(GET_NOTIFICATIONS, { variables: { limit: 20 } });

  const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
    refetchQueries: [GET_ME],
  });
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    refetchQueries: [GET_ME, GET_NOTIFICATIONS],
  });

  const notifications = data?.getNotifications ?? [];
  const unread = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id) => {
    await markRead({ variables: { notificationId: id } });
    refetch();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-gray-100">Notifications</h3>
          {unread > 0 && (
            <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-medium text-white">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 hover:text-purple-400 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              All read
            </button>
          )}
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Bell className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left border-b border-gray-800/50 transition-colors duration-150 ${
                n.read ? 'opacity-60' : 'hover:bg-gray-800/50'
              }`}
            >
              <span className="mt-0.5 text-xl flex-shrink-0">{getNotificationIcon(n.type)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.read ? 'text-gray-400' : 'text-gray-100'}`}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{n.message}</p>
                <p className="mt-1 text-xs text-gray-600">{formatRelativeTime(n.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
