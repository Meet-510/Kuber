import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { LogOut, Edit3, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UPDATE_PROFILE } from '../graphql/mutations.js';
import { GET_ME } from '../graphql/queries.js';
import { useAuthStore } from '../store/authStore.js';
import { formatCurrency, formatDate, getInitials } from '../lib/utils.js';
import Layout from '../components/Layout.jsx';

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  const { data } = useQuery(GET_ME);
  const account = data?.getMe?.accounts?.[0];
  const me = data?.getMe;

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [GET_ME],
    onCompleted: ({ updateProfile }) => {
      updateUser(updateProfile);
      toast.success('Profile updated');
      setEditingName(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleNameSave = () => {
    if (!newName.trim() || newName.trim() === user?.name) {
      setEditingName(false);
      return;
    }
    updateProfile({ variables: { name: newName.trim() } });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl animate-fade-in">
        <header className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">Account</p>
          </div>
          <div className="md:col-span-9">
            <h1 className="serif text-5xl md:text-7xl leading-[0.98] tracking-tight text-ink">
              Your <span className="serif-italic text-ink-3">profile.</span>
            </h1>
          </div>
        </header>

        {/* Identity */}
        <section className="mt-16 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">Identity</p>
          </div>
          <div className="md:col-span-9 border-t border-line pt-8">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-line text-lg font-medium text-ink overflow-hidden">
                {me?.avatar ? (
                  <img src={me.avatar} alt={me.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(me?.name || user?.name)
                )}
              </div>

              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="input-field py-2 text-base"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    />
                    <button
                      onClick={handleNameSave}
                      disabled={loading}
                      className="flex-shrink-0 rounded-full bg-ink p-2.5 text-paper hover:bg-accent transition-colors"
                      aria-label="Save"
                    >
                      <Check className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h2 className="serif text-3xl leading-none tracking-tight text-ink">
                      {me?.name || user?.name}
                    </h2>
                    <button
                      onClick={() => { setNewName(me?.name || user?.name || ''); setEditingName(true); }}
                      className="rounded-full p-1.5 text-ink-4 hover:text-ink transition-colors"
                      aria-label="Edit name"
                    >
                      <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
                <p className="mt-2 text-sm text-ink-3">{me?.email || user?.email}</p>
                <p className="mt-1 text-xs text-ink-4">
                  Member since {me?.createdAt ? formatDate(me.createdAt) : '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Account details */}
        <section className="mt-16 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">Account</p>
          </div>
          <div className="md:col-span-9">
            <dl className="border-t border-line divide-y divide-line">
              <Row label="Account number" value={account?.accountNumber ?? '—'} mono />
              <Row label="Balance" value={formatCurrency(account?.balance ?? 0)} />
              <Row label="Currency" value={account?.currency ?? 'CAD'} />
            </dl>
          </div>
        </section>

        {/* Security */}
        <section className="mt-16 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">Security</p>
          </div>
          <div className="md:col-span-9">
            <dl className="border-t border-line divide-y divide-line">
              <Row label="Password" value="Protected" meta="Last updated: never (simulated)" />
              <Row label="Session" value="Active" meta="Expires in 7 days" />
            </dl>
          </div>
        </section>

        {/* Sign out */}
        <section className="mt-16 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow">Sign out</p>
          </div>
          <div className="md:col-span-9 border-t border-line pt-8">
            <button
              onClick={handleLogout}
              className="btn-secondary group"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Sign out of Kuber
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function Row({ label, value, meta, mono }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-5">
      <div>
        <dt className="eyebrow">{label}</dt>
        {meta && <p className="mt-1 text-xs text-ink-4">{meta}</p>}
      </div>
      <dd className={`text-sm font-medium text-ink ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
