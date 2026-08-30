import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const AgentDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const stats = {
    total: tickets.length,
    New: tickets.filter(t => t.status === 'New').length,
    'In Progress': tickets.filter(t => t.status === 'In Progress').length,
    Resolved: tickets.filter(t => t.status === 'Resolved').length,
    High: tickets.filter(t => t.priority === 'High').length,
  };

  const filtered = statusFilter === 'All' ? tickets : tickets.filter(t => t.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Agent Dashboard</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ['Total', stats.total], ['New', stats.New], ['In Progress', stats['In Progress']],
            ['Resolved', stats.Resolved], ['High Priority', stats.High]
          ].map(([label, val]) => (
            <div key={label} className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-gray-800">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="mb-4 px-3 py-2 border rounded">
          <option>All</option>
          <option>New</option>
          <option>Assigned</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>

        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="text-gray-500">No tickets found.</p>}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Ticket #</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Category</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <Link to={`/agent/tickets/${t._id}`} className="text-blue-600 hover:underline">
                      {t.ticketNumber}
                    </Link>
                  </td>
                  <td className="p-3">{t.subject}</td>
                  <td className="p-3"><StatusBadge status={t.status} /></td>
                  <td className="p-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="p-3">{t.category}</td>
                  <td className="p-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;