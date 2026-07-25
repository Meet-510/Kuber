import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Plus, X, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { GET_GOALS, GET_ME } from '../graphql/queries.js';
import { CREATE_GOAL } from '../graphql/mutations.js';
import GoalCard from '../components/GoalCard.jsx';
import Layout from '../components/Layout.jsx';

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '🎓', '💍', '🏋️', '📱', '🌴', '💰', '🎵'];
const GOAL_COLORS = [
  '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#6366f1',
];

const DEFAULT_FORM = { name: '', targetAmount: '', deadline: '', color: '#8b5cf6', icon: '🎯' };

export default function Goals() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const { data, loading } = useQuery(GET_GOALS);
  const goals = data?.getGoals ?? [];

  const [createGoal, { loading: creating }] = useMutation(CREATE_GOAL, {
    refetchQueries: [GET_GOALS, GET_ME],
    onCompleted: () => {
      toast.success('Goal created!');
      setForm(DEFAULT_FORM);
      setShowModal(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const target = parseFloat(form.targetAmount);
    if (!form.name.trim()) return toast.error('Goal name is required');
    if (!target || target <= 0) return toast.error('Enter a valid target amount');
    createGoal({
      variables: {
        name: form.name.trim(),
        targetAmount: target,
        deadline: form.deadline || null,
        color: form.color,
        icon: form.icon,
      },
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Financial Goals</h1>
            <p className="mt-0.5 text-sm text-gray-500">{goals.length} goal{goals.length !== 1 ? 's' : ''} in progress</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Goal
          </button>
        </div>

        {/* Goals grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-900" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 py-20 text-center">
            <Target className="mb-4 h-12 w-12 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-400">No goals yet</h3>
            <p className="mt-2 text-sm text-gray-600 max-w-sm">
              Set a savings goal and track your progress. Your balance will decrease as you contribute.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-6 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create first goal
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      {/* Create goal modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl animate-slide-up">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-100 mb-5">Create a New Goal</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Icon picker */}
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`text-xl rounded-lg p-1.5 transition-colors ${
                        form.icon === icon
                          ? 'bg-purple-600/30 ring-1 ring-purple-500'
                          : 'hover:bg-gray-800'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal name */}
              <div>
                <label className="label">Goal name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Emergency Fund"
                  required
                />
              </div>

              {/* Target amount */}
              <div>
                <label className="label">Target amount (CAD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    className="input-field pl-8"
                    placeholder="5000"
                    min="1"
                    step="1"
                    required
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="label">
                  Deadline <span className="text-gray-600 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        form.color === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div
                className="rounded-xl px-4 py-3 text-sm text-white"
                style={{ background: form.color + '22', border: `1px solid ${form.color}44` }}
              >
                <span className="mr-2">{form.icon}</span>
                <span style={{ color: form.color }}>{form.name || 'My Goal'}</span>
              </div>

              <button type="submit" disabled={creating} className="btn-primary w-full py-3">
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating…
                  </span>
                ) : (
                  'Create Goal'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
