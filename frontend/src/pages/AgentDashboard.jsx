import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 8;

const AgentDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [ticketPage, setTicketPage] = useState(1);

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Agent Dashboard</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            ['Total', stats.total], ['New', stats.New], ['In Progress', stats['In Progress']],
            ['Resolved', stats.Resolved], ['High Priority', stats.High]
          ].map(([label, val]) => (
            <div key={label} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              🔔 New Bookings ({pendingBookings.length})
            </h3>
            <div className="grid gap-3">
              {pendingBookings.map((b) => (
                <Link key={b._id} to={`/agent/bookings/${b._id}`}
                  className="bg-amber-50 border border-amber-200 p-4 rounded-lg shadow-sm hover:shadow-md transition block">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500">{b.ticket?.ticketNumber}</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{b.ticket?.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">Customer: {b.customer?.name}</p>
                    </div>
                    <PriorityBadge priority={b.urgency} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Active Bookings</h3>
            <div className="grid gap-3">
              {activeBookings.map((b) => (
                <Link key={b._id} to={`/agent/bookings/${b._id}`}
                  className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition block">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500">{b.ticket?.ticketNumber}</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{b.ticket?.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">Customer: {b.customer?.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <PriorityBadge priority={b.urgency} />
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {pastBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Booking History</h3>
            <div className="grid gap-3">
              {pastBookings.map((b) => (
                <Link key={b._id} to={`/agent/bookings/${b._id}`}
                  className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition block opacity-75">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500">{b.ticket?.ticketNumber}</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{b.ticket?.subject}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">All Tickets</h3>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm text-gray-700">
            <option>All</option>
            <option>New</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-500">No tickets match this filter.</p>
          </div>
        )}

        {pagedTickets.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="p-3 font-medium">Ticket #</th>
                  <th className="p-3 font-medium">Subject</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {pagedTickets.map((t) => (
                  <tr key={t._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <Link to={`/agent/tickets/${t._id}`} className="text-blue-600 hover:underline">
                        {t.ticketNumber}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-900">{t.subject}</td>
                    <td className="p-3"><StatusBadge status={t.status} /></td>
                    <td className="p-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="p-3 text-gray-600">{t.category}</td>
                    <td className="p-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
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