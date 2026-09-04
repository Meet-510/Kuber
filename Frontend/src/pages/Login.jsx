import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Eye, EyeOff, Mail, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { LOGIN_USER } from '../graphql/mutations.js';
import { useAuthStore } from '../store/authStore.js';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const [login, { loading }] = useMutation(LOGIN_USER, {
    onCompleted: ({ loginUser }) => {
      setAuth(loginUser.user, loginUser.token);
      toast.success(`Welcome back, ${loginUser.user.name.split(' ')[0]}`);
      navigate('/dashboard', { replace: true });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Enter your email and password');
    login({ variables: { email: form.email.trim().toLowerCase(), password: form.password } });
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Header wordmark */}
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <Link to="/login" className="serif text-2xl text-ink">
          Kuber<span className="serif-italic text-ink-3">.</span>
        </Link>
      </div>

      <div className="mx-auto flex max-w-md flex-col px-6 pt-16 md:pt-24 pb-24 animate-fade-in">
        <p className="eyebrow mb-6">Sign in</p>
        <h1 className="serif text-5xl md:text-6xl leading-[0.98] tracking-tight text-ink">
          Welcome <span className="serif-italic text-ink-3">back.</span>
        </h1>
        <p className="mt-4 text-base text-ink-3">
          Sign in to your Kuber account to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-6">
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail
                className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-5"
                strokeWidth={1.5}
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field pl-12"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className="label mb-0">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-ink-4 hover:text-accent transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field pr-12"
                placeholder="••••••••"
                autoComplete="current-password"
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary group w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/60 border-t-transparent" />
                Signing in…
              </span>
            ) : (
              <>
                Sign in
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                />
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-sm text-ink-4">
          New to Kuber?{' '}
          <Link to="/register" className="text-ink hover:text-accent transition-colors underline underline-offset-4 decoration-line-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
