import { Clock } from 'lucide-react';

export default function InactivityModal({ open, secondsLeft, onStay, onLogout }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30" />
      <div className="relative w-full max-w-sm surface p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink">
            <Clock className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <h2 className="serif text-2xl leading-none text-ink">Still there?</h2>
        </div>
        <p className="text-sm text-ink-3">
          You'll be signed out in{' '}
          <span className="font-mono font-medium text-ink">{secondsLeft}s</span> for your security.
        </p>
        <div className="mt-6 flex gap-2">
          <button onClick={onLogout} className="btn-secondary flex-1 py-2.5 text-sm">
            Sign out
          </button>
          <button onClick={onStay} className="btn-primary flex-1 py-2.5 text-sm">
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
