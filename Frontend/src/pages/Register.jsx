import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ArrowLeft, Check, Eye, EyeOff, Landmark, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { REQUEST_REGISTER_OTP, VERIFY_REGISTER_OTP } from '../graphql/mutations.js';
import { useAuthStore } from '../store/authStore.js';
import OtpInput from '../components/OtpInput.jsx';
import { useDevOtpPeek } from '../hooks/useDevOtp.js';

const RESEND_COOLDOWN = 30;

export default function Register() {
  const [step, setStep] = useState('form'); // 'form' | 'code'
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const peekDevOtp = useDevOtpPeek();

  const [requestOtp, { loading: sending }] = useMutation(REQUEST_REGISTER_OTP, {
    onCompleted: () => {
      setStep('code');
      startCooldown();
      toast.success(`Code sent to ${form.email}`);
      peekDevOtp({ email: form.email, onFill: setCode });
    },
    onError: (e) => toast.error(e.message),
  });

  const [verifyOtp, { loading: verifying }] = useMutation(VERIFY_REGISTER_OTP, {
    onCompleted: ({ verifyRegisterOtp }) => {
      setAuth(verifyRegisterOtp.user, verifyRegisterOtp.token);
      toast.success(`Welcome to Kuber, ${verifyRegisterOtp.user.name.split(' ')[0]}`);
      navigate('/dashboard', { replace: true });
    },
    onError: (e) => toast.error(e.message),
  });

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) clearInterval(cooldownTimer.current);
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(cooldownTimer.current), []);

  const submitForm = (e) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.password) return toast.error('Please fill all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    requestOtp({
      variables: {
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        password: form.password,
      },
    });
  };

  const submitCode = (fullCode = code) => {
    if (fullCode.length !== 6) return;
    verifyOtp({
      variables: {
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        password: form.password,
        code: fullCode,
      },
    });
  };

  const resend = () => {
    if (cooldown > 0) return;
    requestOtp({
      variables: {
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        password: form.password,
      },
    });
  };

  const perks = [
    '$1,000 CAD welcome balance',
    'Instant e-transfers',
    'Real-time transfer notifications',
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
            Send money instantly and track every transaction — all in one place.
          </p>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-gray-300">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1f5c3d]/15 text-[#1f5c3d]">
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
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1f5c3d]">
              <Landmark className="h-7 w-7 text-[#f2f0e9]" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-5">
            {['form', 'code'].map((s, i) => (
              <span
                key={s}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  ['form', 'code'].indexOf(step) >= i ? 'bg-[#1f5c3d]' : 'bg-gray-800'
                }`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-100 text-center">
            {step === 'form' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 text-center">
            {step === 'form' ? (
              'Free forever. No credit card required.'
            ) : (
              <>
                Sent to <span className="text-gray-300 font-medium">{form.email}</span>
              </>
            )}
          </p>

          <div className="mt-6 card">
            {step === 'form' && (
              <form onSubmit={submitForm} className="space-y-5 animate-fade-in">
                <div>
                  <label className="label">Full name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Alex Johnson"
                    autoComplete="name"
                    autoFocus
                    required
                  />
                </div>

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
                      required
                    />
                  </div>
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
                      minLength={6}
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

                <button type="submit" disabled={sending} className="btn-primary w-full py-3 text-base">
                  {sending ? 'Sending code…' : 'Continue'}
                </button>
              </form>
            )}

            {step === 'code' && (
              <div className="space-y-5 animate-fade-in">
                <OtpInput
                  value={code}
                  onChange={setCode}
                  onComplete={(full) => submitCode(full)}
                  autoFocus
                />

                <button
                  onClick={() => submitCode()}
                  disabled={verifying || code.length !== 6}
                  className="btn-primary w-full py-3 text-base"
                >
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                      Creating account…
                    </span>
                  ) : (
                    'Create account'
                  )}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setCode(''); }}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={cooldown > 0 || sending}
                    className="text-[#2c7a52] hover:text-[#1f5c3d] transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#2c7a52] hover:text-[#1f5c3d] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
