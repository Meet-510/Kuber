import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { User, Mail, CreditCard, Shield, LogOut, Edit3, Check } from 'lucide-react';
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
      toast.success('Profile updated!');
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
      <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Profile</h1>

        {/* Avatar + name */}
        <div className="card flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-[#1f5c3d] text-2xl font-medium text-[#f2f0e9]">
            {me?.avatar ? (
              <img src={me.avatar} alt={me.name} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              getInitials(me?.name || user?.name)
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-field py-1.5 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                />
                <button
                  onClick={handleNameSave}
                  disabled={loading}
                  className="flex-shrink-0 rounded-lg bg-purple-600 p-2 text-white hover:bg-purple-500 transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-100">{me?.name || user?.name}</h2>
                <button
                  onClick={() => { setNewName(me?.name || user?.name || ''); setEditingName(true); }}
                  className="rounded-lg p-1 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-0.5">{me?.email || user?.email}</p>
            <p className="text-xs text-gray-600 mt-1">
              Member since {me?.createdAt ? formatDate(me.createdAt) : '—'}
            </p>
          </div>
        </div>

        {/* Account info */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-200 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-400" />
            Account Details
          </h3>

          <div className="space-y-3">
            <InfoRow label="Account Number" value={account?.accountNumber ?? '—'} mono />
            <InfoRow label="Balance" value={formatCurrency(account?.balance ?? 0)} highlight />
            <InfoRow label="Currency" value={account?.currency ?? 'CAD'} />
          </div>
        </div>

        {/* Personal info */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-200 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            Personal Information
          </h3>
          <div className="space-y-3">
            <InfoRow label="Full Name" value={me?.name || user?.name || '—'} />
            <InfoRow label="Email" value={me?.email || user?.email || '—'} />
          </div>
        </div>

        {/* Security */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-200 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            Security
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-300">Password</p>
                <p className="text-xs text-gray-600">Last updated: never (simulated)</p>
              </div>
              <span className="badge bg-emerald-400/10 text-emerald-400">Protected</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-300">JWT Session</p>
                <p className="text-xs text-gray-600">Expires in 7 days</p>
              </div>
              <span className="badge bg-blue-400/10 text-blue-400">Active</span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </Layout>
  );
}

function InfoRow({ label, value, mono, highlight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-sm font-medium ${
          highlight ? 'text-purple-300' : mono ? 'font-mono text-gray-300' : 'text-gray-300'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
