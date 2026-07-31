import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { CheckCircle, Eye, EyeOff, Landmark } from 'lucide-react';
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
      // Small delay so the user sees the success state before we route them.
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error('Password must be at least 6 characters');
    if (pw !== confirm) return toast.error('Passwords don\'t match');
    resetPassword({ variables: { id, token, password: pw } });
  };

  const linkLooksBad = !id || !token;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1f5c3d]">
            <Landmark className="h-7 w-7 text-[#f2f0e9]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
            {done ? 'Password updated' : 'Choose a new password'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {done
              ? 'Redirecting you to sign in…'
              : linkLooksBad
                ? 'This link looks incomplete.'
                : 'Enter and confirm your new password below.'}
          </p>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center animate-fade-in space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1f5c3d]/15">
                <CheckCircle className="h-7 w-7 text-[#1f5c3d]" />
              </div>
              <p className="text-sm text-gray-400">
                You can now sign in with your new password.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5 animate-fade-in">
              <div>
                <label className="label">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="input-field pr-11"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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

              <button
                type="submit"
                disabled={loading || linkLooksBad}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                    Updating password…
                  </span>
                ) : (
                  'Update password'
                )}
              </button>

              <Link
                to="/login"
                className="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
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
