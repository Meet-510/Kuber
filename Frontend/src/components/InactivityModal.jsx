import { Clock } from 'lucide-react';

export default function InactivityModal({ open, secondsLeft, onStay, onLogout }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1a1915]/50" />
      <div className="relative w-full max-w-sm rounded-xl bg-gray-900 border border-gray-800 p-6 shadow-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f5c3d]/10 text-[#1f5c3d]">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-100">Still there?</h2>
        </div>
        <p className="text-sm text-gray-400">
          You'll be signed out in{' '}
          <span className="font-mono font-medium text-gray-100">{secondsLeft}s</span> for your security.
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={onLogout} className="btn-secondary flex-1 py-2 text-sm">
            Sign out now
          </button>
          <button onClick={onStay} className="btn-primary flex-1 py-2 text-sm">
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
