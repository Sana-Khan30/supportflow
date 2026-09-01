import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 6;

const CustomerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticketPage, setTicketPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets/my');
      setTickets(res.data);
      const bRes = await api.get('/bookings/my');
      setBookings(bRes.data);
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const deleteTicket = async (e, ticketId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await api.delete(`/tickets/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const ticketPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const pagedTickets = tickets.slice((ticketPage - 1) * PAGE_SIZE, ticketPage * PAGE_SIZE);

  const bookingPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const pagedBookings = bookings.slice((bookingPage - 1) * PAGE_SIZE, bookingPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Tickets</h2>
            <p className="text-sm text-gray-500 mt-0.5">{tickets.length} total</p>
          </div>
          <button onClick={() => navigate('/customer/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            + New Ticket
          </button>
        </div>

        {loading && <p className="text-gray-500 mt-6">Loading...</p>}
        {error && <p className="text-red-500 mt-6">{error}</p>}
        {!loading && tickets.length === 0 && (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-10 text-center mt-6">
            <p className="text-gray-500">No tickets yet.</p>
            <p className="text-sm text-gray-400 mt-1">Create your first ticket to get help from our team.</p>
          </div>
        )}

        <div className="grid gap-3 mt-6">
          {pagedTickets.map((t) => (
            <Link key={t._id} to={`/customer/tickets/${t._id}`}
              className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition block">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">{t.ticketNumber}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{t.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  <button onClick={(e) => deleteTicket(e, t._id)}
                    className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Pagination page={ticketPage} totalPages={ticketPages} onChange={setTicketPage} />

        <div className="mt-12 mb-1">
          <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
          <p className="text-sm text-gray-500 mt-0.5">{bookings.length} total</p>
        </div>

        {!loading && bookings.length === 0 && (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-10 text-center mt-6">
            <p className="text-gray-500">No bookings yet.</p>
            <p className="text-sm text-gray-400 mt-1">Book a worker from a ticket to see it here.</p>
          </div>
        )}

                <div className="grid gap-3 mt-6">
          {pagedBookings.filter((b) => b.ticket).map((b) => (
            <Link key={b._id} to={`/customer/tickets/${b.ticket._id}`}
              className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition block">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">{b.ticket.ticketNumber}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{b.ticket.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">Worker: {b.agent?.name}</p>
                </div>
                <div className="flex gap-2">
                  <PriorityBadge priority={b.urgency} />
                  <StatusBadge status={b.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Pagination page={bookingPage} totalPages={bookingPages} onChange={setBookingPage} />
      </div>
    </div>
  );
};

export default CustomerDashboard;