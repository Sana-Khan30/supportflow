import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Layers,
  Zap
} from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SentimentBadge from '../components/SentimentBadge';
import Pagination from '../components/Pagination';
import { useSocket } from '../context/SocketContext';

const PAGE_SIZE = 8;

const StatCard = ({ label, value, icon: Icon, accent, subtext }) => (
  <div className="bg-white border border-ink-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
    {accent && <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />}
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-mono text-ink-400 font-medium">{label}</span>
      {Icon && <Icon size={14} className="text-ink-400" />}
    </div>
    <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
    {subtext && <p className="text-[11px] text-ink-400 mt-1 font-mono">{subtext}</p>}
  </div>
);

const BookingRow = ({ b, highlight }) => (
  <Link
    to={`/agent/bookings/${b._id}`}
    className={`flex bg-white border rounded-xl overflow-hidden shadow-sm hover:border-ink-300 transition-all ${
      highlight ? 'border-amber-400/50 bg-amber-50/20' : 'border-ink-100'
    }`}
  >
    <div className={`w-1.5 shrink-0 ${highlight ? 'bg-amber-500' : 'bg-slate-300'}`} />
    <div className="flex-1 flex flex-wrap justify-between items-center gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="font-mono text-[11px] text-ink-400">#{b.ticket?.ticketNumber}</p>
        <p className="font-display font-semibold text-sm text-ink-900 mt-0.5 truncate">
          {b.ticket?.subject}
        </p>
        <p className="text-xs text-ink-500 mt-0.5">
          Customer: <strong>{b.customer?.name}</strong>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <PriorityBadge priority={b.urgency} size="sm" />
        <StatusBadge status={b.status} size="sm" />
      </div>
    </div>
  </Link>
);

const AgentDashboard = () => {
  const { socket } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [ticketPage, setTicketPage] = useState(1);
  const [pulse, setPulse] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data || []);
      const bRes = await api.get('/bookings/assigned');
      setBookings(bRes.data || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    setTicketPage(1);
  }, [statusFilter, priorityFilter, sentimentFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    if (!socket) return;
    const onNewTicket = () => {
      setPulse(true);
      fetchTickets();
      setTimeout(() => setPulse(false), 2000);
    };
    socket.on('ticket_created', onNewTicket);
    socket.on('ticket_updated', fetchTickets);
    return () => {
      socket.off('ticket_created', onNewTicket);
      socket.off('ticket_updated', fetchTickets);
    };
  }, [socket]);

  const now = new Date();
  const slaBreachedCount = tickets.filter(
    (t) => t.slaDeadline && new Date(t.slaDeadline) < now && t.status !== 'Resolved'
  ).length;

  const stats = {
    total: tickets.length,
    New: tickets.filter((t) => t.status === 'New').length,
    'In Progress': tickets.filter((t) => t.status === 'In Progress').length,
    Resolved: tickets.filter((t) => t.status === 'Resolved').length,
    High: tickets.filter((t) => t.priority === 'High').length,
    Frustrated: tickets.filter((t) => (t.sentiment || 'Neutral') === 'Frustrated').length,
    Urgent: tickets.filter((t) => (t.sentiment || 'Neutral') === 'Urgent').length,
    slaBreached: slaBreachedCount
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (sentimentFilter !== 'All' && (t.sentiment || 'Neutral') !== sentimentFilter) return false;
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSub = t.subject?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchNum = t.ticketNumber?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      if (!matchSub && !matchDesc && !matchNum && !matchCat) return false;
    }
    return true;
  });

  const ticketPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedTickets = filtered.slice((ticketPage - 1) * PAGE_SIZE, ticketPage * PAGE_SIZE);

  const pendingBookings = bookings.filter((b) => b.status === 'Pending');

  // Fast Filter Pill helper
  const handleQuickChip = (type, val) => {
    if (type === 'sentiment') {
      setSentimentFilter(sentimentFilter === val ? 'All' : val);
    } else if (type === 'priority') {
      setPriorityFilter(priorityFilter === val ? 'All' : val);
    } else if (type === 'status') {
      setStatusFilter(statusFilter === val ? 'All' : val);
    } else if (type === 'category') {
      setCategoryFilter(categoryFilter === val ? 'All' : val);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900 pb-16">
      <Navbar />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">
              Operations Control Center
            </h1>
            <p className="text-xs text-ink-500 font-mono mt-0.5">
              Live AI-triaged queue, sentiment radar & supervisor actions
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pulse && (
              <span className="text-xs font-mono text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                New ticket landed
              </span>
            )}
            <Link
              to="/agent/analytics"
              className="px-3.5 py-1.5 bg-white border border-ink-200 hover:border-ink-900 text-ink-900 rounded-lg text-xs font-mono font-medium transition-all shadow-2xs flex items-center gap-1.5"
            >
              <TrendingUp size={13} />
              View Full Analytics →
            </Link>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Queue" value={stats.total} icon={Inbox} />
          <StatCard label="Intake (New)" value={stats.New} accent="bg-slate-400" />
          <StatCard label="In Progress" value={stats['In Progress']} accent="bg-amber-500" />
          <StatCard label="Resolved" value={stats.Resolved} accent="bg-emerald-500" />
          <StatCard label="High Priority" value={stats.High} accent="bg-rose-500" />
          <StatCard
            label="SLA Breached"
            value={stats.slaBreached}
            accent="bg-rose-600"
            subtext={stats.slaBreached > 0 ? 'Requires attention' : 'All compliant'}
          />
        </div>

        {/* Interactive Quick-Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-ink-100 shadow-2xs text-xs font-mono">
          <span className="text-ink-400 font-medium text-[11px] uppercase mr-1">Quick Slicers:</span>
          
          <button
            onClick={() => {
              setStatusFilter('All');
              setPriorityFilter('All');
              setSentimentFilter('All');
              setCategoryFilter('All');
            }}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'All' && priorityFilter === 'All' && sentimentFilter === 'All' && categoryFilter === 'All'
                ? 'bg-ink-900 text-white font-bold'
                : 'bg-slate-100 text-ink-600 hover:bg-slate-200'
            }`}
          >
            All ({tickets.length})
          </button>

          <button
            onClick={() => handleQuickChip('sentiment', 'Frustrated')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              sentimentFilter === 'Frustrated'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100'
            }`}
          >
            <span>⚡ Frustrated</span>
            <span className="text-[10px] opacity-80">({stats.Frustrated})</span>
          </button>

          <button
            onClick={() => handleQuickChip('sentiment', 'Urgent')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              sentimentFilter === 'Urgent'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            <span>🔥 Urgent</span>
            <span className="text-[10px] opacity-80">({stats.Urgent})</span>
          </button>

          <button
            onClick={() => handleQuickChip('priority', 'High')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              priorityFilter === 'High'
                ? 'bg-rose-700 text-white font-bold'
                : 'bg-slate-100 text-ink-700 hover:bg-slate-200'
            }`}
          >
            <span>High Priority ({stats.High})</span>
          </button>

          <button
            onClick={() => handleQuickChip('category', 'Billing')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              categoryFilter === 'Billing'
                ? 'bg-indigo-700 text-white font-bold'
                : 'bg-slate-100 text-ink-700 hover:bg-slate-200'
            }`}
          >
            Billing ({tickets.filter((t) => t.category === 'Billing').length})
          </button>

          <button
            onClick={() => handleQuickChip('category', 'Technical / Bug')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              categoryFilter === 'Technical / Bug'
                ? 'bg-indigo-700 text-white font-bold'
                : 'bg-slate-100 text-ink-700 hover:bg-slate-200'
            }`}
          >
            Technical / Bug ({tickets.filter((t) => t.category === 'Technical / Bug').length})
          </button>
        </div>

        {/* Assigned Bookings Banner */}
        {pendingBookings.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-ink-900 flex items-center gap-2">
              <Clock size={15} className="text-amber-600" />
              Pending Specialist Bookings ({pendingBookings.length})
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {pendingBookings.map((b) => (
                <BookingRow key={b._id} b={b} highlight />
              ))}
            </div>
          </div>
        )}

        {/* Filters & Queue Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-ink-900">
                Ticket Pipeline
              </h2>
              <span className="font-mono text-xs text-ink-400 bg-slate-100 px-2 py-0.5 rounded">
                {filtered.length} matching
              </span>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subject, category, #..."
                  className="pl-7 pr-3 py-1.5 bg-slate-50 border border-ink-200 rounded-lg text-xs focus:ring-1 focus:ring-ink-900 w-48"
                />
                <Search size={12} className="absolute left-2.5 top-2.5 text-ink-400" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-ink-200 rounded-lg text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-ink-200 rounded-lg text-xs"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12 text-ink-400 font-mono text-xs">
              Loading active ticket pipeline...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-ink-400 border border-dashed border-ink-200 rounded-lg">
              <p className="font-mono text-xs">No tickets match the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ink-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-ink-500 font-mono text-[11px] border-b border-ink-100">
                  <tr>
                    <th className="py-3 px-4">Ticket #</th>
                    <th className="py-3 px-4">Subject & Intent</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Sentiment</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">SLA Target</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 font-sans">
                  {pagedTickets.map((t) => {
                    const isBreached = t.slaDeadline && new Date(t.slaDeadline) < now && t.status !== 'Resolved';
                    const targetStr = t.slaDeadline
                      ? new Date(t.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';

                    return (
                      <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                          <Link to={`/agent/tickets/${t._id}`} className="hover:underline">
                            #{t.ticketNumber}
                          </Link>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <Link
                            to={`/agent/tickets/${t._id}`}
                            className="font-semibold text-ink-900 hover:text-ink-700 block truncate"
                          >
                            {t.subject}
                          </Link>
                          {t.intent && (
                            <span className="text-[10px] text-ink-400 block truncate font-mono">
                              Intent: {t.intent}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={t.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-4">
                          <PriorityBadge priority={t.priority} size="sm" />
                        </td>

                        <td className="py-3.5 px-4">
                          <SentimentBadge sentiment={t.sentiment || 'Neutral'} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-ink-600">
                          {t.category}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span
                            className={
                              isBreached
                                ? 'text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                                : 'text-slate-600'
                            }
                          >
                            {isBreached ? 'Breached' : targetStr}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/agent/tickets/${t._id}`}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-ink-900 hover:text-ink-600"
                          >
                            Open <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={ticketPage} totalPages={ticketPages} onChange={setTicketPage} />
        </div>
      </main>
    </div>
  );
};

export default AgentDashboard;