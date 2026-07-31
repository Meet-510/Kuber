import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, RefreshCw, CreditCard } from 'lucide-react';
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
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Balance hero + quick actions */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Balance card */}
          <div className="lg:col-span-2 rounded-xl balance-gradient p-6 text-[#f2f0e9]">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-[#9a968c]" />
              <p className="text-xs font-medium uppercase tracking-wider text-[#9a968c]">
                Total balance
              </p>
            </div>

            {meLoading ? (
              <div className="h-10 w-40 animate-pulse rounded-lg bg-white/10" />
            ) : (
              <p className="text-4xl font-semibold tracking-tight">
                {formatCurrency(account?.balance ?? 0)}
              </p>
            )}

            <p className="mt-1 text-sm text-[#79756b]">{account?.currency ?? 'CAD'}</p>

            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-[11px] uppercase tracking-wider text-[#79756b]">Account number</p>
              <p className="font-mono text-sm tracking-widest mt-1 text-[#d8d4ca]">
                {account?.accountNumber
                  ? account.accountNumber.replace(/(.{4})/g, '$1 ').trim()
                  : '—'}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-4">
            <Link to="/send" className="card flex flex-1 items-center gap-4 hover:border-purple-500/40 hover:bg-gray-800 transition-all duration-200 group">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25 transition-colors">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-200">Send money</p>
                <p className="text-xs text-gray-500">Instant e-transfer</p>
              </div>
            </Link>

            <Link to="/transactions" className="card flex flex-1 items-center gap-4 hover:border-purple-500/40 hover:bg-gray-800 transition-all duration-200 group">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25 transition-colors">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-200">Transactions</p>
                <p className="text-xs text-gray-500">View history</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100">Recent transactions</h2>
            <Link to="/transactions" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
              View all →
            </Link>
          </div>
          {txLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-800" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentTxs.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              No transactions yet.<br />
              <Link to="/send" className="text-purple-400 hover:underline mt-1 inline-block">
                Send your first transfer →
              </Link>
            </div>
          ) : (
            <div className="space-y-1 -mx-3">
              {recentTxs.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
