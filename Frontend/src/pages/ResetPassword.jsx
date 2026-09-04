import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { CheckCircle, Eye, EyeOff, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { RESET_PASSWORD } from '../graphql/mutations.js';

export default function ResetPassword() {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD, {
    onCompleted: () => {
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error('Password must be at least 6 characters');
    if (pw !== confirm) return toast.error("Passwords don't match");
    resetPassword({ variables: { id, token, password: pw } });
  };

  const linkLooksBad = !id || !token;

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <Link to="/login" className="serif text-2xl text-ink">
          Kuber<span className="serif-italic text-ink-3">.</span>
        </Link>
      </div>

      <div className="mx-auto flex max-w-md flex-col px-6 pt-16 md:pt-24 pb-24 animate-fade-in">
        <p className="eyebrow mb-6">New password</p>
        <h1 className="serif text-5xl md:text-6xl leading-[0.98] tracking-tight text-ink">
          {done ? (
            <>Password <span className="serif-italic text-ink-3">updated.</span></>
          ) : (
            <>Choose a new <span className="serif-italic text-ink-3">password.</span></>
          )}
        </h1>
        <p className="mt-4 text-base text-ink-3">
          {done
            ? 'Redirecting you to sign in…'
            : linkLooksBad
              ? 'This link looks incomplete.'
              : 'Enter and confirm your new password below.'}
        </p>

        <div className="mt-12">
          {done ? (
            <div className="flex items-center gap-4 border-t border-line pt-8 animate-fade-in">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink">
                <CheckCircle className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-ink-3">
                You can now sign in with your new password.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6 animate-fade-in">
              <div>
                <label className="label">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="input-field pr-12"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-5 hover:text-ink transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirm password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <button type="submit" disabled={loading || linkLooksBad} className="btn-primary group w-full">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/60 border-t-transparent" />
                    Updating password…
                  </span>
                ) : (
                  <>
                    Update password
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="block text-center text-sm text-ink-4 hover:text-ink transition-colors"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
