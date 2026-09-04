import { useEffect, useState } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { CheckCircle, ArrowUpRight, Check, X, Loader2 } from 'lucide-react';
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
      <div className="mx-auto max-w-5xl animate-fade-in">
        <header className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">e-Transfer</p>
          </div>
          <div className="md:col-span-9">
            <h1 className="serif text-5xl md:text-7xl leading-[0.98] tracking-tight text-ink">
              Send <span className="serif-italic text-ink-3">money.</span>
            </h1>
            <p className="mt-4 text-base text-ink-3 max-w-lg">
              Instant transfer to any Kuber account.
            </p>
          </div>
        </header>

        {result ? (
          <section className="mt-16 grid gap-8 md:grid-cols-12 animate-slide-up">
            <div className="md:col-span-3">
              <p className="eyebrow">Complete</p>
            </div>
            <div className="md:col-span-9">
              <div className="flex items-center gap-5 border-t border-line pt-10">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink">
                  <CheckCircle className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="serif text-3xl leading-none tracking-tight text-ink">Transfer sent</p>
                  <p className="mt-2 text-sm text-ink-3">
                    {formatCurrency(result.amount)} to{' '}
                    <span className="text-ink">{result.receiverName || result.receiverEmail}</span>
                  </p>
                </div>
              </div>

              {result.message && (
                <p className="mt-8 serif-italic text-lg text-ink-3">"{result.message}"</p>
              )}

              <dl className="mt-12 border-t border-line divide-y divide-line">
                <Row label="Amount" value={formatCurrency(result.amount)} />
                <Row label="Status" value="Completed" />
              </dl>

              <button onClick={resetForm} className="btn-primary group mt-12">
                Send another
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-16 grid gap-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="eyebrow">Available</p>
              <p className="mt-2 serif text-3xl leading-none tracking-tight text-ink">
                {formatCurrency(balance)}
              </p>
              <p className="mt-2 text-xs text-ink-4">CAD balance</p>
            </div>

            <div className="md:col-span-9">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="label">Recipient's email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={form.recipientEmail}
                      onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                      className="input-field pr-12"
                      placeholder="recipient@example.com"
                      required
                    />
                    {emailValid && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2">
                        {lookupLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-ink-5" strokeWidth={1.5} />
                        ) : recipientKnown ? (
                          <Check className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                        ) : recipientMissing ? (
                          <X className="h-4 w-4 text-red-400" strokeWidth={1.5} />
                        ) : null}
                      </span>
                    )}
                  </div>
                  {emailValid && !lookupLoading && recipientKnown && (
                    <p className="mt-2 text-xs text-ink-3">Sending to <span className="text-ink">{recipient.name}</span></p>
                  )}
                  {emailValid && !lookupLoading && recipientMissing && (
                    <p className="mt-2 text-xs text-red-400">That email isn't on Kuber yet.</p>
                  )}
                </div>

                <div>
                  <label className="label">Amount (CAD)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-4 serif text-xl">$</span>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="input-field pl-9"
                      placeholder="0.00"
                      min="0.01"
                      max={balance}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setForm({ ...form, amount: String(amt) })}
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${
                          Number(form.amount) === amt
                            ? 'border-ink bg-ink text-paper'
                            : 'border-line text-ink-3 hover:border-ink hover:text-ink'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">
                    Message <span className="text-ink-5 normal-case tracking-normal font-normal">(optional)</span>
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

                {recipientKnown && form.amount && (
                  <div className="border-t border-line pt-6 animate-fade-in">
                    <p className="eyebrow mb-3">Preview</p>
                    <p className="serif text-2xl leading-tight text-ink">
                      Sending <span className="serif-italic">{formatCurrency(parseFloat(form.amount) || 0)}</span> to {recipient.name}.
                    </p>
                    {form.message && (
                      <p className="mt-3 serif-italic text-base text-ink-3">"{form.message}"</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="btn-primary group w-full"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/60 border-t-transparent" />
                      Sending…
                    </span>
                  ) : (
                    <>
                      Send {form.amount ? formatCurrency(parseFloat(form.amount) || 0) : 'money'}
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
