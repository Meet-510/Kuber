import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Search, ArrowUpRight, ArrowDownLeft, Clock, Filter } from 'lucide-react';
import { GET_TRANSACTIONS } from '../graphql/queries.js';
import { useAuthStore } from '../store/authStore.js';
import TransactionItem from '../components/TransactionItem.jsx';
import Layout from '../components/Layout.jsx';

const FILTERS = [
  { label: 'All',      value: 'all' },
  { label: 'Received', value: 'received' },
  { label: 'Sent',     value: 'sent' },
  { label: 'Pending',  value: 'pending' },
];

// Stable reference so useMemo deps don't change on every render.
const EMPTY = [];

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { user } = useAuthStore();

  const { data, loading, fetchMore } = useQuery(GET_TRANSACTIONS, {
    variables: { limit: 30, offset: 0 },
  });

  const page = data?.getTransactions;
  const allTxs = page?.items ?? EMPTY;
  const totalCount = page?.totalCount ?? 0;
  const hasMore = page?.hasMore ?? false;

  const filtered = useMemo(() => {
    return allTxs.filter((tx) => {
      const matchesSearch =
        !search ||
        tx.senderEmail.toLowerCase().includes(search.toLowerCase()) ||
        tx.receiverEmail.toLowerCase().includes(search.toLowerCase()) ||
        (tx.senderName || '').toLowerCase().includes(search.toLowerCase()) ||
        (tx.receiverName || '').toLowerCase().includes(search.toLowerCase()) ||
        (tx.message || '').toLowerCase().includes(search.toLowerCase());

      const isSent = tx.senderEmail === user?.email;
      const matchesFilter =
        filter === 'all' ||
        (filter === 'sent' && isSent && tx.status !== 'PENDING') ||
        (filter === 'received' && !isSent) ||
        (filter === 'pending' && tx.status === 'PENDING');

      return matchesSearch && matchesFilter;
    });
  }, [allTxs, search, filter, user]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Transactions</h1>
          <p className="mt-0.5 text-sm text-gray-500">{totalCount} total transactions</p>
        </div>

        {/* Search + Filter bar */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Search by name, email, or message…"
            />
          </div>

          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                  filter === f.value
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <div className="card">
          {loading ? (
            <div className="space-y-3 p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-800" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-800" />
                  </div>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-800" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Filter className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">
                {search || filter !== 'all' ? 'No transactions match your filter' : 'No transactions yet'}
              </p>
            </div>
          ) : (
            <div className="-mx-3 divide-y divide-gray-800/50">
              {filtered.map((tx) => (
                <div key={tx.id} className="px-3">
                  <TransactionItem tx={tx} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => fetchMore({ variables: { limit: 30, offset: allTxs.length } })}
            className="btn-secondary w-full mt-4"
          >
            Load more
          </button>
        )}
      </div>
    </Layout>
  );
}
