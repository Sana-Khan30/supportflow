import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Pagination from '../components/Pagination';
import { useSocket } from '../context/SocketContext';

const PAGE_SIZE = 8;

const StatCard = ({ label, value, accent }) => (
  <div className="bg-white border border-ink-100 rounded-md p-4 text-center relative overflow-hidden">
    {accent && <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />}
    <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
    <p className="text-xs text-ink-400 mt-0.5">{label}</p>
  </div>
);

const BookingRow = ({ b, highlight }) => (
  <Link
    to={`/agent/bookings/${b._id}`}
    className={`flex bg-white border rounded-md overflow-hidden shadow-stub hover:border-ink-300 transition-colors ${
      highlight ? 'border-signal-amber/40' : 'border-ink-100'
    }`}
  >
    <div className={`w-1.5 shrink-0 ${highlight ? 'bg-signal-amber' : 'bg-ink-200'}`} />
    <div className="flex-1 flex justify-between items-center gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="font-mono text-xs text-ink-400">#{b.ticket?.ticketNumber}</p>
        <p className="font-display font-semibold text-ink-900 mt-0.5 truncate">{b.ticket?.subject}</p>
        <p className="text-xs text-ink-400 mt-1">Customer: {b.customer?.name}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <PriorityBadge priority={b.urgency} />
        <StatusBadge status={b.status} />
      </div>
    </div>
  </Link>
);

const AgentDashboard = () => {
  const { socket } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [ticketPage, setTicketPage] = useState(1);
  const [pulse, setPulse] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
      const bRes = await api.get('/bookings/assigned');
      setBookings(bRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);
  useEffect(() => { setTicketPage(1); }, [statusFilter]);

  // Live-refresh the queue when a new ticket lands or an existing one changes.
  // Backend broadcasts the raw ticket via 'ticket_created' to the agents room
  // (see ticketController.js createTicket) — it does not wrap this in a
  // Notification document, so we listen for that event directly.
  useEffect(() => {
    if (!socket) return;
    const onNewTicket = () => {
      setPulse(true);
      fetchTickets();
      setTimeout(() => setPulse(false), 1500);
    };
    socket.on('ticket_created', onNewTicket);
    return () => socket.off('ticket_created', onNewTicket);
  }, [socket]);

  const stats = {
    total: tickets.length,
    New: tickets.filter(t => t.status === 'New').length,
    'In Progress': tickets.filter(t => t.status === 'In Progress').length,
    Resolved: tickets.filter(t => t.status === 'Resolved').length,
    High: tickets.filter(t => t.priority === 'High').length,
  };

  const filtered = statusFilter === 'All' ? tickets : tickets.filter(t => t.status === statusFilter);
  const ticketPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedTickets = filtered.slice((ticketPage - 1) * PAGE_SIZE, ticketPage * PAGE_SIZE);

  const pendingBookings = bookings.filter(b => b.status === 'Pending');
  const activeBookings = bookings.filter(b => ['Accepted', 'In Progress'].includes(b.status));
  const pastBookings = bookings.filter(b => ['Completed', 'Rejected'].includes(b.status));

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-ink-900">Agent dashboard</h2>
          <div className="flex items-center gap-4">
            {pulse && (
              <span className="text-xs font-mono text-signal-amber flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-amber animate-pulse" />
                new ticket landed
              </span>
            )}
            <Link to="/agent/analytics" className="text-sm font-medium text-ink-600 hover:text-ink-900">
              View analytics →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="New" value={stats.New} accent="bg-ink-300" />
          <StatCard label="In progress" value={stats['In Progress']} accent="bg-signal-amber" />
          <StatCard label="Resolved" value={stats.Resolved} accent="bg-signal-teal" />
          <StatCard label="High priority" value={stats.High} accent="bg-signal-coral" />
        </div>

        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
              New bookings ({pendingBookings.length})
            </h3>
            <div className="grid gap-3">
              {pendingBookings.map((b) => <BookingRow key={b._id} b={b} highlight />)}
            </div>
          </div>
        )}

        {activeBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display text-base font-semibold text-ink-900 mb-3">Active bookings</h3>
            <div className="grid gap-3">
              {activeBookings.map((b) => <BookingRow key={b._id} b={b} />)}
            </div>
          </div>
        )}

        {pastBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display text-base font-semibold text-ink-900 mb-3">Booking history</h3>
            <div className="grid gap-3 opacity-70">
              {pastBookings.map((b) => <BookingRow key={b._id} b={b} />)}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold text-ink-900">All tickets</h3>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-ink-100 rounded-md text-sm text-ink-700 focus:border-ink-900 focus:outline-none">
            <option>All</option>
            <option>New</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>

        {loading && <p className="text-ink-400">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-md border border-dashed border-ink-200 p-10 text-center">
            <p className="text-ink-400">No tickets match this filter.</p>
          </div>
        )}

        {pagedTickets.length > 0 && (
          <div className="bg-white rounded-md border border-ink-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-ink-400">
                <tr>
                  <th className="p-3 font-medium font-mono text-xs">Ticket #</th>
                  <th className="p-3 font-medium">Subject</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {pagedTickets.map((t) => (
                  <tr key={t._id} className="border-t border-ink-100 hover:bg-ink-50/50">
                    <td className="p-3">
                      <Link to={`/agent/tickets/${t._id}`} className="font-mono text-xs text-ink-900 hover:underline">
                        {t.ticketNumber}
                      </Link>
                    </td>
                    <td className="p-3 text-ink-900 font-medium">{t.subject}</td>
                    <td className="p-3"><StatusBadge status={t.status} /></td>
                    <td className="p-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="p-3 text-ink-500">{t.category}</td>
                    <td className="p-3 text-ink-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={ticketPage} totalPages={ticketPages} onChange={setTicketPage} />
      </div>
    </div>
  );
};

export default AgentDashboard;