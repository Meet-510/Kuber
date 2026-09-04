import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Search, Filter } from 'lucide-react';
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
      <div className="mx-auto max-w-5xl animate-fade-in">
        {/* Header */}
        <header className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">{totalCount} total</p>
          </div>
          <div className="md:col-span-9">
            <h1 className="serif text-5xl md:text-7xl leading-[0.98] tracking-tight text-ink">
              Every <span className="serif-italic text-ink-3">transaction.</span>
            </h1>
          </div>
        </header>

        {/* Search + filter */}
        <section className="mt-16 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">Filter</p>
          </div>
          <div className="md:col-span-9 space-y-4">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-5" strokeWidth={1.5} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
                placeholder="Search by name, email, or message…"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    filter === f.value
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink-3 hover:border-ink hover:text-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* List */}
        <section className="mt-16 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">Ledger</p>
          </div>
          <div className="md:col-span-9">
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 border-t border-line py-5">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-line" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-line" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
                    </div>
                    <div className="h-4 w-20 animate-pulse rounded bg-line" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="border-t border-line py-20 text-center text-ink-4">
                <Filter className="mx-auto mb-3 h-8 w-8 opacity-40" strokeWidth={1.5} />
                <p className="text-sm">
                  {search || filter !== 'all' ? 'No transactions match your filter' : 'No transactions yet'}
                </p>
              </div>
            ) : (
              <div>
                {filtered.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))}
              </div>
            )}

            {hasMore && (
              <button
                onClick={() => fetchMore({ variables: { limit: 30, offset: allTxs.length } })}
                className="btn-secondary w-full mt-8"
              >
                Load more
              </button>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
