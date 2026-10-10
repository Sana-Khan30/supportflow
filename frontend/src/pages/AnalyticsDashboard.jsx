import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, Clock, CheckCircle2, Star, ShieldAlert, HeartHandshake, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const COLORS = {
  New: '#94A3B8',
  Assigned: '#64748B',
  'In Progress': '#F59E0B',
  Resolved: '#10B981',
  Low: '#14B8A6',
  Medium: '#F59E0B',
  High: '#F43F5E',
  Frustrated: '#F43F5E',
  Urgent: '#EA580C',
  Neutral: '#64748B',
  Positive: '#10B981'
};

const StatCard = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="bg-white border border-ink-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
    {accent && <div className={`absolute top-0 left-0 right-0 h-1 ${accent}`} />}
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-mono text-ink-400 font-medium">{label}</span>
      {Icon && <Icon size={15} className="text-ink-400" />}
    </div>
    <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
    {sub && <p className="text-[11px] text-ink-400 mt-1 font-mono">{sub}</p>}
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white border border-ink-100 rounded-xl p-5 shadow-sm space-y-3">
    <div>
      <h3 className="font-display font-semibold text-sm text-ink-900">{title}</h3>
      {subtitle && <p className="text-[11px] font-mono text-ink-400">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const tooltipStyle = {
  fontSize: 12,
  backgroundColor: '#1E293B',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 8,
  padding: '6px 10px',
  fontFamily: 'Inter, sans-serif'
};

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/overview')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics'));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 text-ink-900">
        <Navbar />
        <div className="p-8 max-w-4xl mx-auto">
          <p className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-mono text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-100 text-ink-900">
        <Navbar />
        <p className="p-8 text-center text-ink-400 font-mono text-xs">Loading operational telemetry...</p>
      </div>
    );
  }

  const { totals, byStatus, byPriority, bySentiment, byCategory, ticketsPerDay, agentStats } = data;

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900 pb-16">
      <Navbar />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/agent" className="text-xs font-mono text-ink-500 hover:text-ink-900 flex items-center gap-1">
                <ArrowLeft size={12} /> Back to Desk
              </Link>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-900">
              Operations & AI Triage Intelligence Analytics
            </h1>
            <p className="text-xs text-ink-400 font-mono mt-0.5">
              Live database telemetry, SLA performance & sentiment distributions
            </p>
          </div>
        </div>

        {/* Top KPIs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total Cases"
            value={totals.tickets}
            sub={`${totals.resolutionRate}% resolution rate`}
            icon={TrendingUp}
          />
          <StatCard
            label="Resolved Cases"
            value={totals.resolved}
            accent="bg-emerald-500"
            icon={CheckCircle2}
          />
          <StatCard
            label="SLA Adherence"
            value={`${totals.slaAdherenceRate}%`}
            sub={totals.slaBreached > 0 ? `${totals.slaBreached} breached` : '100% on target'}
            accent={totals.slaAdherenceRate >= 90 ? 'bg-emerald-500' : 'bg-rose-500'}
            icon={ShieldAlert}
          />
          <StatCard
            label="Avg Resolution"
            value={totals.avgResolutionHours !== null ? `${totals.avgResolutionHours}h` : '—'}
            icon={Clock}
          />
          <StatCard
            label="Customer Rating"
            value={totals.avgRating !== null ? `${totals.avgRating} ★` : '—'}
            accent="bg-amber-500"
            icon={Star}
          />
          <StatCard
            label="Frustrated Rate"
            value={`${
              totals.tickets
                ? Math.round(
                    (((bySentiment?.find((s) => s.name === 'Frustrated')?.value || 0) +
                      (bySentiment?.find((s) => s.name === 'Urgent')?.value || 0)) /
                      totals.tickets) *
                      100
                  )
                : 0
            }%`}
            sub="Negative / Urgent sentiment"
            accent="bg-rose-500"
            icon={HeartHandshake}
          />
        </div>

        {/* Charts Row 1: Sentiment Breakdown & Priority Breakdown */}
        <div className="grid md:grid-cols-2 gap-4">
          <ChartCard
            title="Customer Sentiment Distribution"
            subtitle="Extracted via real-time multi-dimensional AI triage"
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySentiment || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {(bySentiment || []).map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#64748B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Ticket Urgency & Priority Spread"
            subtitle="SLA response targets tied to priority ratings"
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {byPriority.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#64748B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 14-Day Intake Curve */}
        <ChartCard
          title="Intake Trend — Last 14 Days"
          subtitle="Daily ticket generation and influx curve"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ticketsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bottom Row: Top Categories & Agent Performance */}
        <div className="grid md:grid-cols-2 gap-4">
          <ChartCard
            title="Top Complaint Categories"
            subtitle="Ranked by volume from customer intake"
          >
            <div className="space-y-2.5 pt-1">
              {byCategory.length === 0 && (
                <p className="text-xs text-ink-300 font-mono">No category data yet.</p>
              )}
              {byCategory.map((c) => (
                <div key={c.name} className="flex items-center gap-3 text-xs">
                  <span className="text-ink-700 w-36 truncate font-medium">{c.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-ink-900 rounded-full"
                      style={{ width: `${(c.value / (byCategory[0]?.value || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-ink-500 w-8 text-right">{c.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Specialist Performance & CSAT Ratings"
            subtitle="Resolved volume and average star rating"
          >
            <div className="space-y-1.5 pt-1">
              {agentStats.length === 0 && (
                <p className="text-xs text-ink-300 font-mono">No active specialists found.</p>
              )}
              {agentStats.map((a, i) => (
                <div
                  key={a.name}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-ink-300 w-4">{i + 1}</span>
                    <span className="font-semibold text-ink-900 truncate">{a.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-ink-500">
                    <span>{a.resolved} resolved</span>
                    {a.avgRating !== null ? (
                      <span className="text-amber-600 font-semibold">{a.avgRating} ★</span>
                    ) : (
                      <span className="text-ink-300">No reviews</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
