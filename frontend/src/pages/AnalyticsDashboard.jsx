import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const COLORS = {
  New: '#9AA2AD',
  Assigned: '#6C7684',
  'In Progress': '#DB9A3C',
  Resolved: '#3D7A68',
  Low: '#3D7A68',
  Medium: '#DB9A3C',
  High: '#BF4A3D',
};

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white border border-ink-100 rounded-md p-5">
    <p className="font-display text-3xl font-bold text-ink-900">{value}</p>
    <p className="text-sm text-ink-400 mt-1">{label}</p>
    {sub && <p className="text-xs text-ink-300 mt-1">{sub}</p>}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white border border-ink-100 rounded-md p-5">
    <h3 className="font-display font-semibold text-ink-900 mb-4">{title}</h3>
    {children}
  </div>
);

const tooltipStyle = {
  fontSize: 12,
  border: '1px solid #E4E6E9',
  borderRadius: 6,
  fontFamily: 'Inter, sans-serif',
};

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/overview')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics'));
  }, []);

  if (error) return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <p className="p-8 text-signal-coral">{error}</p>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <p className="p-8 text-ink-400">Loading analytics…</p>
    </div>
  );

  const { totals, byStatus, byPriority, byCategory, ticketsPerDay, agentStats } = data;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-ink-900 mb-1">Analytics</h2>
        <p className="text-sm text-ink-400 mb-6 font-mono">Team-wide performance overview</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total tickets" value={totals.tickets} />
          <StatCard label="Resolved" value={totals.resolved} sub={`${totals.resolutionRate}% resolution rate`} />
          <StatCard
            label="Avg. resolution time"
            value={totals.avgResolutionHours !== null ? `${totals.avgResolutionHours}h` : '—'}
          />
          <StatCard
            label="Avg. rating"
            value={totals.avgRating !== null ? `${totals.avgRating} ★` : '—'}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <ChartCard title="Tickets by status">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E1" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6C7684' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6C7684' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byStatus.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#171B21'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tickets by priority">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E1" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6C7684' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6C7684' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byPriority.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#171B21'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Tickets created — last 14 days">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ticketsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E1" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6C7684' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6C7684' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#DB9A3C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <ChartCard title="Top categories">
            <div className="space-y-2">
              {byCategory.length === 0 && <p className="text-sm text-ink-300">No data yet.</p>}
              {byCategory.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-sm text-ink-600 w-28 truncate shrink-0">{c.name}</span>
                  <div className="flex-1 bg-ink-50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-ink-900 rounded-full"
                      style={{ width: `${(c.value / byCategory[0].value) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-ink-400 w-6 text-right">{c.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Agent leaderboard">
            <div className="space-y-1">
              {agentStats.length === 0 && <p className="text-sm text-ink-300">No agents yet.</p>}
              {agentStats.map((a, i) => (
                <div key={a.name} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-ink-300 w-4">{i + 1}</span>
                    <span className="text-sm text-ink-800 font-medium truncate">{a.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-ink-400">
                    <span>{a.resolved} resolved</span>
                    {a.avgRating !== null && <span>{a.avgRating} ★</span>}
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
