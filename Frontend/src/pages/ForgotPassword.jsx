import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ArrowLeft, Landmark, Mail, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { REQUEST_PASSWORD_RESET } from '../graphql/mutations.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const [requestReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET, {
    // Server always returns true (enumeration defense) — we show the same
    // confirmation regardless of whether the email exists in the DB.
    onCompleted: () => setSent(true),
    onError: (e) => toast.error(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter your email');
    requestReset({ variables: { email: email.trim().toLowerCase() } });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1f5c3d]">
            <Landmark className="h-7 w-7 text-[#f2f0e9]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
            {sent ? 'Check your email' : 'Reset your password'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {sent
              ? 'If an account with that email exists, we\'ve sent a reset link.'
              : 'Enter your email and we\'ll send you a link to set a new password.'}
          </p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center animate-fade-in space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1f5c3d]/15">
                <MailCheck className="h-7 w-7 text-[#1f5c3d]" />
              </div>
              <p className="text-sm text-gray-400">
                The link expires in 15 minutes and can only be used once. Check your spam folder if
                you don't see it soon.
              </p>
              <Link
                to="/login"
                className="btn-primary w-full py-2.5 inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5 animate-fade-in">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                    Sending link…
                  </span>
                ) : (
                  'Send reset link'
                )}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
