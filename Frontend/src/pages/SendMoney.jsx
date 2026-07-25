import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ArrowUpRight, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { SEND_TRANSFER } from '../graphql/mutations.js';
import { GET_ME, GET_TRANSACTIONS } from '../graphql/queries.js';
import { formatCurrency } from '../lib/utils.js';
import Layout from '../components/Layout.jsx';

const QUICK_AMOUNTS = [25, 50, 100, 250, 500];

export default function SendMoney() {
  const [form, setForm] = useState({ recipientEmail: '', amount: '', message: '' });
  const [result, setResult] = useState(null);

  const { data: meData } = useQuery(GET_ME);
  const balance = meData?.getMe?.accounts?.[0]?.balance ?? 0;

  const [sendTransfer, { loading }] = useMutation(SEND_TRANSFER, {
    refetchQueries: [GET_ME, GET_TRANSACTIONS],
    onCompleted: (data) => {
      setResult(data.sendTransfer);
      setForm({ recipientEmail: '', amount: '', message: '' });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.recipientEmail) return toast.error('Recipient email is required');
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (amount > balance) return toast.error('Insufficient balance');
    sendTransfer({ variables: { ...form, amount } });
  };

  const resetForm = () => setResult(null);

  return (
    <Layout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Send Money</h1>
          <p className="mt-1 text-sm text-gray-500">Instant e-transfer to anyone with an email</p>
        </div>

        {result ? (
          /* Success State */
          <div className="card text-center animate-slide-up">
            <div className="mb-6">
              {result.status === 'COMPLETED' ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                    <CheckCircle className="h-9 w-9 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-100">Transfer Sent!</h2>
                  <p className="mt-2 text-gray-400">
                    {formatCurrency(result.amount)} was sent to{' '}
                    <span className="text-gray-200">{result.receiverName || result.receiverEmail}</span>
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
                    <Clock className="h-9 w-9 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-100">Transfer Pending</h2>
                  <p className="mt-2 text-gray-400">
                    {formatCurrency(result.amount)} is held for{' '}
                    <span className="text-gray-200">{result.receiverEmail}</span>. They'll receive
                    it automatically when they register.
                  </p>
                </>
              )}

              {result.message && (
                <p className="mt-3 text-sm text-gray-500 italic">"{result.message}"</p>
              )}
            </div>

            <div className="rounded-xl bg-gray-800 p-4 text-left text-sm mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="font-semibold text-gray-200">{formatCurrency(result.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={result.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}>
                  {result.status.toLowerCase()}
                </span>
              </div>
            </div>

            <button onClick={resetForm} className="btn-primary w-full">
              Send another transfer
            </button>
          </div>
        ) : (
          /* Form State */
          <div className="card">
            {/* Balance indicator */}
            <div className="mb-6 flex items-center justify-between rounded-xl bg-gray-800 px-4 py-3">
              <span className="text-sm text-gray-400">Available balance</span>
              <span className="font-semibold text-gray-200">{formatCurrency(balance)}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Recipient's email</label>
                <input
                  type="email"
                  value={form.recipientEmail}
                  onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                  className="input-field"
                  placeholder="recipient@example.com"
                  required
                />
                <p className="mt-1.5 text-xs text-gray-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  If they're not registered, they'll receive an invite email
                </p>
              </div>

              <div>
                <label className="label">Amount (CAD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
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
                {/* Quick amounts */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setForm({ ...form, amount: String(amt) })}
                      className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                        Number(form.amount) === amt
                          ? 'bg-purple-600 text-white'
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

              {/* Preview */}
              {form.recipientEmail && form.amount && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-sm animate-fade-in">
                  <p className="text-gray-300">
                    Sending{' '}
                    <span className="font-semibold text-purple-300">{formatCurrency(parseFloat(form.amount) || 0)}</span>
                    {' '}to{' '}
                    <span className="font-semibold text-gray-200">{form.recipientEmail}</span>
                  </p>
                  {form.message && (
                    <p className="mt-1 text-gray-500 italic">"{form.message}"</p>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" />
                    Send {form.amount ? formatCurrency(parseFloat(form.amount) || 0) : 'Money'}
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
