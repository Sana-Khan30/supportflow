import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const CustomerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets/my');
      setTickets(res.data);
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Tickets</h2>
          <button onClick={() => navigate('/customer/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + New Ticket
          </button>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && tickets.length === 0 && (
          <p className="text-gray-500">No tickets yet. Create your first one.</p>
        )}

        <div className="grid gap-4">
          {tickets.map((t) => (
            <Link key={t._id} to={`/customer/tickets/${t._id}`}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition block">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">{t.ticketNumber}</p>
                  <p className="font-semibold text-gray-800">{t.subject}</p>
                </div>
                <div className="flex gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;