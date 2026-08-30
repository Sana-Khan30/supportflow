import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

const AgentTicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [edit, setEdit] = useState({ category: '', priority: '', aiSummary: '' });
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const pollRef = useRef(null);

  const loadData = async (syncEdit = false) => {
    const [tRes, mRes] = await Promise.all([
      api.get(`/tickets/${id}`), api.get(`/messages/${id}`)
    ]);
    setTicket(tRes.data);
    if (syncEdit) {
      setEdit({ category: tRes.data.category, priority: tRes.data.priority, aiSummary: tRes.data.aiSummary });
    }
    setMessages(mRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData(true);
    pollRef.current = setInterval(() => loadData(false), 3000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  const assignToMe = async () => {
    const res = await api.patch(`/tickets/${id}/assign`);
    setTicket(res.data);
  };

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/tickets/${id}`, edit);
      setTicket(res.data);
      setSuccess('Saved successfully');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status) => {
    setError('');
    try {
      const body = { status };
      if (status === 'Resolved') body.resolutionNote = resolutionNote;
      const res = await api.patch(`/tickets/${id}`, body);
      setTicket(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.post(`/messages/${id}`, { text });
    setText('');
    loadData(false);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!ticket) return <div className="p-8 text-red-500">Ticket not found</div>;

  const isResolved = ticket.status === 'Resolved';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        {error && <p className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</p>}
        {success && <p className="bg-green-100 text-green-700 p-2 rounded text-sm">{success}</p>}

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-gray-400">{ticket.ticketNumber}</p>
              <h2 className="text-xl font-bold text-gray-800">{ticket.subject}</h2>
            </div>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-gray-600 text-sm mb-3">{ticket.description}</p>
          {!ticket.agent && (
            <button onClick={assignToMe} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              Assign to Me
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-3">
            AI Suggestion (Editable)
            {edit.aiSummary?.includes('AI triage unavailable') && (
              <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Needs manual entry</span>
            )}
          </h3>
          <label className="block text-sm text-gray-600 mb-1">Category</label>
          <input value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}
            disabled={isResolved} className="w-full mb-3 px-3 py-2 border rounded disabled:bg-gray-100" />

          <label className="block text-sm text-gray-600 mb-1">Priority</label>
          <select value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value })}
            disabled={isResolved} className="w-full mb-3 px-3 py-2 border rounded disabled:bg-gray-100">
            <option>Low</option><option>Medium</option><option>High</option>
          </select>

          <label className="block text-sm text-gray-600 mb-1">Summary</label>
          <textarea value={edit.aiSummary} onChange={(e) => setEdit({ ...edit, aiSummary: e.target.value })}
            disabled={isResolved} rows="2" className="w-full mb-3 px-3 py-2 border rounded disabled:bg-gray-100" />

          {!isResolved && (
            <button onClick={saveEdit} disabled={saving}
              className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {!isResolved && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-3">Status</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              {['New', 'Assigned', 'In Progress'].map((s) => (
                <button key={s} onClick={() => changeStatus(s)}
                  className={`px-3 py-1 rounded text-sm ${ticket.status === s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
            <label className="block text-sm text-gray-600 mb-1">Resolution Note (required to resolve)</label>
            <textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)}
              rows="2" className="w-full mb-2 px-3 py-2 border rounded" placeholder="Describe the resolution..." />
            <button onClick={() => changeStatus('Resolved')}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
              Mark Resolved
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-3">Conversation</h3>
          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
            {messages.length === 0 && <p className="text-gray-400 text-sm">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m._id} className={`p-2 rounded max-w-xs ${m.senderRole === 'agent' ? 'bg-gray-100 ml-auto' : 'bg-blue-100'}`}>
                <p className="text-xs text-gray-500">{m.senderRole}</p>
                <p className="text-sm">{m.text}</p>
              </div>
            ))}
          </div>
          {!isResolved ? (
            <form onSubmit={sendMessage} className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)}
                className="flex-1 px-3 py-2 border rounded" placeholder="Reply to customer..." />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Send</button>
            </form>
          ) : (
            <p className="text-sm text-gray-400">Ticket resolved — conversation closed.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentTicketDetail;