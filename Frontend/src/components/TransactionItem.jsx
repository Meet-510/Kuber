import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { formatCurrency, formatRelativeTime, getStatusColor, cn } from '../lib/utils.js';
import { useAuthStore } from '../store/authStore.js';

export default function TransactionItem({ tx }) {
  const user = useAuthStore((s) => s.user);
  const isSent = tx.senderEmail === user?.email;
  const counterparty = isSent ? (tx.receiverName || tx.receiverEmail) : (tx.senderName || tx.senderEmail);
  const counterpartyEmail = isSent ? tx.receiverEmail : tx.senderEmail;

  return (
    <div className="group flex items-center gap-5 border-t border-line py-5 transition-colors duration-150">
      {/* Direction icon — hairline circle */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-3">
        {isSent
          ? <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          : <ArrowDownLeft className="h-4 w-4" strokeWidth={1.5} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-medium text-ink truncate">{counterparty}</p>
          <span className={cn('badge', getStatusColor(tx.status))}>
            {tx.status === 'PENDING' ? <Clock className="mr-1 h-3 w-3" strokeWidth={1.5} /> : null}
            {tx.status.toLowerCase()}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-4 truncate">
          {tx.message || counterpartyEmail} · {formatRelativeTime(tx.createdAt)}
        </p>
      </div>

      {/* Amount — serif for editorial weight */}
      <p
        className={cn(
          'serif text-2xl leading-none tracking-tight flex-shrink-0',
          isSent ? 'text-red-400' : 'text-emerald-400'
        )}
      >
        {isSent ? '−' : '+'}{formatCurrency(tx.amount)}
      </p>
    </div>
  );
}
