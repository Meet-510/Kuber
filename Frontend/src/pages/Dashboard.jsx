import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, RefreshCw } from 'lucide-react';
import { GET_ME, GET_TRANSACTIONS } from '../graphql/queries.js';
import { useAuthStore } from '../store/authStore.js';
import { formatCurrency } from '../lib/utils.js';
import TransactionItem from '../components/TransactionItem.jsx';
import Layout from '../components/Layout.jsx';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: meData, loading: meLoading, refetch } = useQuery(GET_ME);
  const { data: txData, loading: txLoading } = useQuery(GET_TRANSACTIONS, {
    variables: { limit: 6 },
  });

  const account = meData?.getMe?.accounts?.[0];
  const recentTxs = txData?.getTransactions?.items ?? [];

  return (
    <Layout>
      <div className="mx-auto max-w-5xl animate-fade-in">
        {/* Editorial header */}
        <header className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">
              {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="md:col-span-9 flex items-start justify-between gap-4">
            <h1 className="serif text-5xl md:text-7xl leading-[0.98] tracking-tight text-ink">
              {getGreeting()},<br />
              <span className="serif-italic text-ink-3">
                {user?.name?.split(' ')[0] || 'friend'}.
              </span>
            </h1>
            <button
              onClick={() => refetch()}
              className="mt-2 rounded-full p-2 text-ink-4 hover:text-ink transition-colors"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Balance — inverted ink block */}
        <section className="mt-16 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">Total balance</p>
          </div>
          <div className="md:col-span-9">
            <div className="balance-gradient rounded-[28px] px-10 py-12 text-paper">
              <p className="text-xs uppercase tracking-eyebrow text-ink-5">
                {account?.currency ?? 'CAD'}
              </p>
              {meLoading ? (
                <div className="mt-4 h-14 w-56 animate-pulse rounded bg-paper/10" />
              ) : (
                <p className="mt-4 serif text-6xl md:text-8xl leading-none tracking-tight">
                  {formatCurrency(account?.balance ?? 0)}
                </p>
              )}
              <div className="mt-10 flex items-end justify-between border-t border-paper/10 pt-6">
                <div>
                  <p className="text-[11px] uppercase tracking-eyebrow text-ink-5">Account</p>
                  <p className="mt-1 font-mono text-sm tracking-widest text-paper/80">
                    {account?.accountNumber
                      ? account.accountNumber.replace(/(.{4})/g, '$1 ').trim()
                      : '—'}
                  </p>
                </div>
                <Link
                  to="/send"
                  className="group inline-flex items-center gap-2 rounded-full border border-paper/20 px-5 py-2.5 text-xs font-medium text-paper hover:border-paper transition-colors"
                >
                  Send money
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions — editorial list, no cards */}
        <section className="mt-24">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="eyebrow">Actions</p>
            </div>
            <div className="md:col-span-9">
              <QuickLink to="/send" icon={ArrowUpRight} title="Send money" meta="Instant e-transfer" />
              <QuickLink to="/transactions" icon={ClipboardList} title="Transactions" meta="Full history" />
            </div>
          </div>
        </section>

        {/* Recent transactions — editorial spread */}
        <section className="mt-24">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="eyebrow">Recent</p>
              <h2 className="mt-2 serif text-3xl leading-none tracking-tight text-ink">
                Activity
              </h2>
            </div>
            <div className="md:col-span-9">
              {txLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 border-t border-line py-5">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-line" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-3/4 animate-pulse rounded bg-line" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTxs.length === 0 ? (
                <div className="border-t border-line py-16 text-center text-sm text-ink-4">
                  No transactions yet.<br />
                  <Link to="/send" className="mt-2 inline-block text-ink hover:text-accent transition-colors underline underline-offset-4 decoration-line-2">
                    Send your first transfer →
                  </Link>
                </div>
              ) : (
                <div>
                  {recentTxs.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
              <div className="mt-6 border-t border-line pt-6 text-right">
                <Link
                  to="/transactions"
                  className="text-sm text-ink hover:text-accent transition-colors underline underline-offset-4 decoration-line-2"
                >
                  View all →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function QuickLink({ to, icon: Icon, title, meta }) {
  return (
    <Link
      to={to}
      className="group flex items-baseline justify-between gap-6 border-t border-line py-6 transition-colors hover:text-ink"
    >
      <div className="flex items-baseline gap-6">
        <Icon className="h-4 w-4 flex-shrink-0 text-ink-4 group-hover:text-ink transition-colors" strokeWidth={1.5} />
        <div>
          <p className="serif text-2xl leading-none tracking-tight text-ink">{title}</p>
          <p className="mt-2 text-sm text-ink-4">{meta}</p>
        </div>
      </div>
      <ArrowUpRight
        className="h-5 w-5 text-ink-4 transition-all duration-200 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={1.5}
      />
    </Link>
  );
}
