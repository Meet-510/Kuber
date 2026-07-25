import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Trash2, Plus, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { ADD_TO_GOAL, DELETE_GOAL } from '../graphql/mutations.js';
import { GET_GOALS, GET_ME } from '../graphql/queries.js';
import { formatCurrency, formatDate } from '../lib/utils.js';

export default function GoalCard({ goal, onUpdate }) {
  const [addAmount, setAddAmount] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [addToGoal, { loading: adding }] = useMutation(ADD_TO_GOAL, {
    refetchQueries: [GET_GOALS, GET_ME],
    onCompleted: () => {
      toast.success(`Added to "${goal.name}"`);
      setAddAmount('');
      setShowAdd(false);
      onUpdate?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const [deleteGoal, { loading: deleting }] = useMutation(DELETE_GOAL, {
    refetchQueries: [GET_GOALS],
    onCompleted: () => toast.success(`Goal "${goal.name}" deleted`),
    onError: (e) => toast.error(e.message),
  });

  const progress = Math.min(goal.progress, 100);

  return (
    <div className="card group relative overflow-hidden animate-slide-up">
      {/* Completed overlay */}
      {goal.completed && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/10 backdrop-blur-sm z-10">
          <div className="text-center">
            <Trophy className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
            <p className="font-semibold text-emerald-400">Goal Achieved!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{goal.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-100">{goal.name}</h3>
            {goal.deadline && (
              <p className="text-xs text-gray-500 mt-0.5">Due {formatDate(goal.deadline)}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => deleteGoal({ variables: { goalId: goal.id } })}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{formatCurrency(goal.savedAmount)} saved</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)`,
              boxShadow: `0 0 8px ${goal.color}66`,
            }}
          />
        </div>
        <p className="mt-1.5 text-right text-xs text-gray-500">
          Goal: {formatCurrency(goal.targetAmount)}
        </p>
      </div>

      {/* Add funds */}
      {!goal.completed && (
        <>
          {showAdd ? (
            <div className="flex gap-2 mt-3">
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Amount"
                min="0.01"
                step="0.01"
                className="input-field text-sm py-2"
                autoFocus
              />
              <button
                onClick={() => {
                  const amt = parseFloat(addAmount);
                  if (!amt || amt <= 0) return toast.error('Enter a valid amount');
                  addToGoal({ variables: { goalId: goal.id, amount: amt } });
                }}
                disabled={adding}
                className="btn-primary py-2 px-4 text-sm flex-shrink-0"
              >
                {adding ? '...' : 'Add'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="btn-secondary py-2 px-3 text-sm flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 py-2 text-sm text-gray-500 hover:border-purple-500/50 hover:text-purple-400 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Add funds
            </button>
          )}
        </>
      )}
    </div>
  );
}
