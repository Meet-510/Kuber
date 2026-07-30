import { useQuery } from '@apollo/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { GET_SPENDING_ANALYTICS } from '../graphql/queries.js';
import { formatCurrency } from '../lib/utils.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-xl text-sm">
      <p className="font-medium text-gray-200 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-400 capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-200">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function SpendingChart() {
  const { data, loading } = useQuery(GET_SPENDING_ANALYTICS);
  const chartData = data?.getSpendingAnalytics ?? [];

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-500 text-sm">
        No transaction data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#b4453c" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#b4453c" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1f6b44" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1f6b44" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e3d9" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#837f75', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#837f75', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: '#6e6b62', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: '#6e6b62', textTransform: 'capitalize' }}>{value}</span>}
        />
        <Area type="monotone" dataKey="sent" stroke="#b4453c" strokeWidth={2} fill="url(#gradSent)" dot={false} />
        <Area type="monotone" dataKey="received" stroke="#1f6b44" strokeWidth={2} fill="url(#gradReceived)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
