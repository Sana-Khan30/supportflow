import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const NewTicket = () => {
  const [form, setForm] = useState({ subject: '', description: '', category: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/tickets', form);
      navigate(`/customer/tickets/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">New Ticket</h2>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full mb-4 px-3 py-2 border rounded" required />

          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full mb-4 px-3 py-2 border rounded" rows="4" required />

          <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full mb-4 px-3 py-2 border rounded" placeholder="e.g. Billing" />

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Submitting (AI analyzing)...' : 'Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewTicket;