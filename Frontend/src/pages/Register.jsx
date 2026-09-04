import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Mail } from 'lucide-react';
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
    'Real-time notifications',
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* Header wordmark */}
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <Link to="/login" className="serif text-2xl text-ink">
          Kuber<span className="serif-italic text-ink-3">.</span>
        </Link>
      </div>

      <div className="mx-auto grid max-w-6xl gap-16 px-6 pt-8 md:grid-cols-12 md:gap-24 md:px-10 md:pt-16">
        {/* Left — editorial pitch */}
        <div className="hidden md:col-span-5 md:flex md:flex-col md:pt-8">
          <p className="eyebrow mb-6">A new account</p>
          <h2 className="serif text-6xl leading-[0.98] tracking-tight text-ink">
            Banking, <br />
            <span className="serif-italic text-ink-3">quietly done.</span>
          </h2>
          <p className="mt-6 max-w-sm text-base text-ink-3">
            Send money instantly and track every transaction — all on one thoughtful surface.
          </p>
          <ul className="mt-10 space-y-4">
            {perks.map((p) => (
              <li key={p} className="flex items-baseline gap-4 text-sm text-ink-3">
                <span className="h-px w-6 bg-line-2" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div className="md:col-span-7 md:col-start-7">
          <div className="max-w-md animate-fade-in">
            <div className="mb-6 flex items-center gap-2">
              {['form', 'code'].map((s, i) => (
                <span
                  key={s}
                  className={`h-px w-8 transition-colors ${
                    ['form', 'code'].indexOf(step) >= i ? 'bg-ink' : 'bg-line-2'
                  }`}
                />
              ))}
              <span className="ml-2 eyebrow">Step {['form', 'code'].indexOf(step) + 1} of 2</span>
            </div>

            <h1 className="serif text-5xl md:text-6xl leading-[0.98] tracking-tight text-ink">
              {step === 'form' ? (
                <>Create your <span className="serif-italic text-ink-3">account.</span></>
              ) : (
                <>Verify your <span className="serif-italic text-ink-3">email.</span></>
              )}
            </h1>
            <p className="mt-4 text-base text-ink-3">
              {step === 'form' ? (
                'Free forever. No credit card required.'
              ) : (
                <>Sent to <span className="text-ink">{form.email}</span></>
              )}
            </p>

            <div className="mt-12">
              {step === 'form' && (
                <form onSubmit={submitForm} className="space-y-6 animate-fade-in">
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
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-5" strokeWidth={1.5} />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input-field pl-12"
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
                        className="input-field pr-12"
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                        minLength={6}
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

                  <button type="submit" disabled={sending} className="btn-primary group w-full">
                    {sending ? 'Sending code…' : (
                      <>
                        Continue
                        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 'code' && (
                <div className="space-y-6 animate-fade-in">
                  <OtpInput
                    value={code}
                    onChange={setCode}
                    onComplete={(full) => submitCode(full)}
                    autoFocus
                  />

                  <button
                    onClick={() => submitCode()}
                    disabled={verifying || code.length !== 6}
                    className="btn-primary w-full"
                  >
                    {verifying ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/60 border-t-transparent" />
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
                      className="flex items-center gap-1 text-ink-4 hover:text-ink transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={resend}
                      disabled={cooldown > 0 || sending}
                      className="text-ink-4 hover:text-accent transition-colors disabled:text-ink-5 disabled:cursor-not-allowed"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-10 text-sm text-ink-4">
                Already have an account?{' '}
                <Link to="/login" className="text-ink hover:text-accent transition-colors underline underline-offset-4 decoration-line-2">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
