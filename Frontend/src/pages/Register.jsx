import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Eye, EyeOff, Landmark, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { REGISTER_USER } from '../graphql/mutations.js';
import { useAuthStore } from '../store/authStore.js';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const [register, { loading }] = useMutation(REGISTER_USER, {
    onCompleted: ({ registerUser }) => {
      setAuth(registerUser.user, registerUser.token);
      toast.success(`Welcome to Kuber, ${registerUser.user.name}! 🎉`);
      navigate('/dashboard');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    register({ variables: form });
  };

  const perks = [
    '$1,000 CAD welcome balance',
    'Instant e-transfers',
    'Financial goal tracking',
  ];

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-16 border-r border-gray-800">
        <div>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1f5c3d]">
            <Landmark className="h-7 w-7 text-[#f2f0e9]" />
          </div>
          <h2 className="text-4xl font-semibold text-gray-100 leading-tight tracking-tight">
            Banking built for<br />
            <span className="gradient-text">the modern age</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-sm">
            Send money instantly, track your spending, and reach your financial goals — all in one place.
          </p>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-gray-300">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1f5c3d]">
              <Landmark className="h-7 w-7 text-[#f2f0e9]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-100">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Free forever. No credit card required.</p>

          <div className="mt-8 card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="Alex Johnson"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field pr-11"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account…
                  </span>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
