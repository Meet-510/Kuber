import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ArrowLeft, Mail, MailCheck, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { REQUEST_PASSWORD_RESET } from '../graphql/mutations.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const [requestReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET, {
    // Server always returns true (enumeration defense).
    onCompleted: () => setSent(true),
    onError: (e) => toast.error(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter your email');
    requestReset({ variables: { email: email.trim().toLowerCase() } });
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <Link to="/login" className="serif text-2xl text-ink">
          Kuber<span className="serif-italic text-ink-3">.</span>
        </Link>
      </div>

      <div className="mx-auto flex max-w-md flex-col px-6 pt-16 md:pt-24 pb-24 animate-fade-in">
        <p className="eyebrow mb-6">Password reset</p>
        <h1 className="serif text-5xl md:text-6xl leading-[0.98] tracking-tight text-ink">
          {sent ? (
            <>Check your <span className="serif-italic text-ink-3">email.</span></>
          ) : (
            <>Reset your <span className="serif-italic text-ink-3">password.</span></>
          )}
        </h1>
        <p className="mt-4 text-base text-ink-3">
          {sent
            ? "If an account with that email exists, we've sent a reset link."
            : "Enter your email and we'll send you a link to set a new password."}
        </p>

        <div className="mt-12">
          {sent ? (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-4 border-t border-line pt-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink">
                  <MailCheck className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-ink-3">
                  The link expires in 15 minutes and can only be used once.
                </p>
              </div>
              <Link to="/login" className="btn-primary group w-full">
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6 animate-fade-in">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-5" strokeWidth={1.5} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary group w-full">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/60 border-t-transparent" />
                    Sending link…
                  </span>
                ) : (
                  <>
                    Send reset link
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-sm text-ink-4 hover:text-ink transition-colors"
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
