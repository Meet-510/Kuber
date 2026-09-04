import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

export const cn = (...inputs) => clsx(inputs);

export const formatCurrency = (amount, currency = 'CAD') =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount);

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return format(d, 'MMM d, yyyy');
};

export const formatRelativeTime = (dateStr) =>
  formatDistanceToNow(new Date(dateStr), { addSuffix: true });

export const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  return format(d, 'MMM d, yyyy • h:mm a');
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED': return 'border-line text-emerald-400';
    case 'PENDING':   return 'border-line text-amber-400';
    case 'FAILED':    return 'border-line text-red-400';
    default:          return 'border-line text-ink-4';
  }
};

export const getNotificationIcon = (type) => {
  switch (type) {
    case 'TRANSFER_SENT':     return '💸';
    case 'TRANSFER_RECEIVED': return '💰';
    default:                  return '🔔';
  }
};
