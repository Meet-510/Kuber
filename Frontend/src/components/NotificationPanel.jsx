import { useQuery, useMutation } from '@apollo/client';
import { X, CheckCheck } from 'lucide-react';
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
    <div className="flex h-full flex-col max-h-[70vh]">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-line px-6 py-5">
        <div className="flex items-baseline gap-3">
          <h3 className="serif text-xl leading-none text-ink">Notifications</h3>
          {unread > 0 && (
            <span className="text-xs text-accent">{unread} new</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1 text-xs text-ink-4 hover:text-ink transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink-4 hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-4">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`flex w-full items-start gap-3 px-6 py-4 text-left border-b border-line/60 transition-colors duration-150 ${
                n.read ? 'opacity-60' : 'hover:bg-paper-2'
              }`}
            >
              <span className="mt-0.5 text-lg flex-shrink-0">{getNotificationIcon(n.type)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.read ? 'text-ink-4' : 'text-ink'}`}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-3 leading-relaxed">{n.message}</p>
                <p className="mt-1.5 text-xs text-ink-4">{formatRelativeTime(n.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
