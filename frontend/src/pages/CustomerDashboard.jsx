import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';

const PAGE_SIZE = 6;

const EmptyState = ({ title, body }) => (
  <div className="bg-white rounded-md border border-dashed border-ink-200 p-10 text-center mt-6">
    <p className="text-ink-700 font-medium">{title}</p>
    <p className="text-sm text-ink-400 mt-1">{body}</p>
  </div>
);

const TicketCard = ({ ticket, booking, onDelete }) => (
  <Link
    to={`/customer/tickets/${ticket._id}`}
    className="group relative flex bg-white border border-ink-100 rounded-md overflow-hidden shadow-stub hover:border-ink-300 transition-colors"
  >
    <div
      className={`w-1.5 shrink-0 ${
        ticket.priority === 'High'
          ? 'bg-signal-coral'
          : ticket.priority === 'Low'
          ? 'bg-signal-teal'
          : 'bg-signal-amber'
      }`}
    />
    <div className="flex-1 px-5 py-4">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-ink-400">
            #{ticket.ticketNumber} · {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
          <p className="font-display font-semibold text-ink-900 mt-0.5 truncate">{ticket.subject}</p>
          <p className="text-sm text-ink-400 mt-1 line-clamp-1">{ticket.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {booking && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink-50 text-xs text-ink-400">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-300 shrink-0" />
          <span>
            Agent booked: <span className="text-ink-700 font-medium">{booking.agent?.name}</span>
          </span>
          <span className="ml-auto">
            {ticket.status === 'Resolved' && ['Pending', 'Accepted'].includes(booking.status) ? (
              <span className="text-ink-300 italic">Not accepted</span>
            ) : (
              <StatusBadge status={booking.status} />
            )}
          </span>
        </div>
      )}
    </div>

    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(ticket._id);
      }}
      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-xs text-ink-300 hover:text-signal-coral transition-opacity"
    >
      Delete
    </button>
  </Link>
);

const CustomerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets/my');
      setTickets(res.data);
      const bRes = await api.get('/bookings/my');
      setBookings(bRes.data.filter((b) => b.ticket));
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await api.delete(`/tickets/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      toast.success('Ticket deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const pages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const paged = tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const bookingByTicketId = (ticketId) => bookings.find((b) => b.ticket._id === ticketId);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">My tickets</h2>
            <p className="text-sm text-ink-400 mt-0.5 font-mono">{tickets.length} total</p>
          </div>
          <Button onClick={() => navigate('/customer/new')}>+ New ticket</Button>
        </div>

        {loading && <p className="text-ink-400 mt-6">Loading…</p>}
        {error && <p className="text-signal-coral mt-6">{error}</p>}
        {!loading && tickets.length === 0 && (
          <EmptyState title="No tickets yet" body="Create your first ticket to get help from our team." />
        )}

        <div className="grid gap-3 mt-6">
          {paged.map((t) => (
            <TicketCard
              key={t._id}
              ticket={t}
              booking={bookingByTicketId(t._id)}
              onDelete={deleteTicket}
            />
          ))}
        </div>
        <Pagination page={page} totalPages={pages} onChange={setPage} />
      </div>
    </div>
  );
};

export default CustomerDashboard;