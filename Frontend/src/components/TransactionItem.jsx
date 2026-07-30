import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { formatCurrency, formatRelativeTime, getStatusColor, cn } from '../lib/utils.js';
import { useAuthStore } from '../store/authStore.js';

export default function TransactionItem({ tx }) {
  const user = useAuthStore((s) => s.user);
  const isSent = tx.senderEmail === user?.email;
  const counterparty = isSent ? (tx.receiverName || tx.receiverEmail) : (tx.senderName || tx.senderEmail);
  const counterpartyEmail = isSent ? tx.receiverEmail : tx.senderEmail;

  return (
    <div className="flex items-center gap-4 rounded-xl p-3 hover:bg-gray-800/50 transition-colors duration-150">
      {/* Avatar */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
          isSent ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
        )}
      >
        {isSent ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-200 truncate">{counterparty}</p>
          <span className={cn('badge', getStatusColor(tx.status))}>
            {tx.status === 'PENDING' ? <Clock className="mr-1 h-3 w-3" /> : null}
            {tx.status.toLowerCase()}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {tx.message || counterpartyEmail} · {formatRelativeTime(tx.createdAt)}
        </p>
      </div>

      {/* Amount */}
      <p
        className={cn(
          'text-sm font-semibold flex-shrink-0',
          isSent ? 'text-red-400' : 'text-emerald-400'
        )}
      >
        {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
      </p>
    </div>
  );
}
