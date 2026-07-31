import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Eye, EyeOff, Landmark, Mail } from 'lucide-react';
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1f5c3d]">
            <Landmark className="h-7 w-7 text-[#f2f0e9]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your Kuber account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#2c7a52] hover:text-[#1f5c3d] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            New to Kuber?{' '}
            <Link
              to="/register"
              className="font-medium text-[#2c7a52] hover:text-[#1f5c3d] transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
