import { useEffect, useState } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { CheckCircle, Send, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SEND_TRANSFER } from '../graphql/mutations.js';
import { GET_ME, GET_TRANSACTIONS, LOOKUP_RECIPIENT } from '../graphql/queries.js';
import { formatCurrency } from '../lib/utils.js';
import Layout from '../components/Layout.jsx';

const QUICK_AMOUNTS = [25, 50, 100, 250, 500];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOOKUP_DEBOUNCE_MS = 400;

export default function SendMoney() {
  const [form, setForm] = useState({ recipientEmail: '', amount: '', message: '' });
  const [result, setResult] = useState(null);

  const { data: meData } = useQuery(GET_ME);
  const balance = meData?.getMe?.accounts?.[0]?.balance ?? 0;

  // Live recipient check — fires as the user types (debounced).
  // `network-only` so a re-typed email always re-queries instead of showing
  // stale cache from a prior lookup.
  const [lookup, { data: lookupData, loading: lookupLoading, called }] = useLazyQuery(
    LOOKUP_RECIPIENT,
    { fetchPolicy: 'network-only' }
  );

  const normalizedEmail = form.recipientEmail.trim().toLowerCase();
  const emailValid = EMAIL_RE.test(normalizedEmail);

  useEffect(() => {
    if (!emailValid) return undefined;
    const t = setTimeout(() => lookup({ variables: { email: normalizedEmail } }), LOOKUP_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [normalizedEmail, emailValid, lookup]);

  const recipient = called && emailValid ? lookupData?.lookupRecipient : null;
  const recipientKnown = recipient?.exists === true;
  const recipientMissing = recipient?.exists === false;

  const [sendTransfer, { loading }] = useMutation(SEND_TRANSFER, {
    refetchQueries: [GET_ME, GET_TRANSACTIONS],
    onCompleted: (data) => {
      setResult(data.sendTransfer);
      setForm({ recipientEmail: '', amount: '', message: '' });
    },
    onError: (e) => toast.error(e.message),
  });

  const canSubmit =
    emailValid &&
    recipientKnown &&
    parseFloat(form.amount) > 0 &&
    parseFloat(form.amount) <= balance;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const amount = parseFloat(form.amount);
    const idempotencyKey = crypto.randomUUID();
    sendTransfer({
      variables: { recipientEmail: normalizedEmail, amount, message: form.message, idempotencyKey },
    });
  };

  const resetForm = () => setResult(null);

  return (
    <Layout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Send money</h1>
          <p className="mt-1 text-sm text-gray-500">Instant e-transfer to a Kuber account</p>
        </div>

        {result ? (
          <div className="card text-center animate-slide-up">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1f5c3d]/15">
                <CheckCircle className="h-9 w-9 text-[#1f5c3d]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-100">Transfer sent</h2>
              <p className="mt-2 text-gray-400">
                {formatCurrency(result.amount)} sent to{' '}
                <span className="text-gray-200">{result.receiverName || result.receiverEmail}</span>
              </p>
              {result.message && (
                <p className="mt-3 text-sm text-gray-500 italic">"{result.message}"</p>
              )}
            </div>

            <div className="rounded-xl bg-gray-800 p-4 text-left text-sm mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="font-medium text-gray-200">{formatCurrency(result.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-[#1f6b44]">completed</span>
              </div>
            </div>

            <button onClick={resetForm} className="btn-primary w-full">
              Send another transfer
            </button>
          </div>
        ) : (
          <div className="card">
            {/* Balance indicator */}
            <div className="mb-6 flex items-center justify-between rounded-xl bg-gray-800 px-4 py-3">
              <span className="text-sm text-gray-400">Available balance</span>
              <span className="font-medium text-gray-200">{formatCurrency(balance)}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Recipient's email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.recipientEmail}
                    onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                    className="input-field pr-10"
                    placeholder="recipient@example.com"
                    required
                  />
                  {emailValid && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {lookupLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      ) : recipientKnown ? (
                        <Check className="h-4 w-4 text-[#1f6b44]" />
                      ) : recipientMissing ? (
                        <X className="h-4 w-4 text-[#b4453c]" />
                      ) : null}
                    </span>
                  )}
                </div>
                {emailValid && !lookupLoading && recipientKnown && (
                  <p className="mt-1.5 text-xs text-[#1f6b44]">Sending to {recipient.name}</p>
                )}
                {emailValid && !lookupLoading && recipientMissing && (
                  <p className="mt-1.5 text-xs text-[#b4453c]">
                    That email isn't on Kuber yet.
                  </p>
                )}
              </div>

              <div>
                <label className="label">Amount (CAD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-field pl-8"
                    placeholder="0.00"
                    min="0.01"
                    max={balance}
                    step="0.01"
                    required
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setForm({ ...form, amount: String(amt) })}
                      className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                        Number(form.amount) === amt
                          ? 'bg-[#1f5c3d] text-[#f2f0e9]'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  Message{' '}
                  <span className="text-gray-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Rent for May"
                  maxLength={100}
                />
              </div>

              {/* Preview — only when we have a real recipient */}
              {recipientKnown && form.amount && (
                <div className="rounded-xl border border-[#1f5c3d]/20 bg-[#1f5c3d]/5 px-4 py-3 text-sm animate-fade-in">
                  <p className="text-gray-300">
                    Sending{' '}
                    <span className="font-medium text-[#2c7a52]">
                      {formatCurrency(parseFloat(form.amount) || 0)}
                    </span>{' '}
                    to <span className="font-medium text-gray-200">{recipient.name}</span>
                  </p>
                  {form.message && <p className="mt-1 text-gray-500 italic">"{form.message}"</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                    Sending…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" />
                    Send {form.amount ? formatCurrency(parseFloat(form.amount) || 0) : 'money'}
                  </span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
