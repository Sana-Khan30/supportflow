import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const CustomerTicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const loadData = async () => {
    const [tRes, mRes] = await Promise.all([
      api.get(`/tickets/${id}`),
      api.get(`/messages/${id}`)
    ]);
    setTicket(tRes.data);
    setMessages(mRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    pollRef.current = setInterval(loadData, 3000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.post(`/messages/${id}`, { text });
    setText('');
    loadData();
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!ticket) return <div className="p-8 text-red-500">Ticket not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <p className="text-xs text-gray-400">{ticket.ticketNumber}</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{ticket.subject}</h2>
          <div className="flex gap-2 mb-3">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{ticket.category}</span>
          </div>
          <p className="text-gray-600 text-sm mb-3">{ticket.description}</p>
          {ticket.aiSummary && (
            ticket.aiSummary.includes('AI triage unavailable') ? (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-800">
                <strong>Pending Manual Review:</strong> Our support team will review and categorize your ticket shortly.
              </div>
            ) : (
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                <strong>AI Summary:</strong> {ticket.aiSummary}
              </div>
            )
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-3">Conversation</h3>
          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
            {messages.length === 0 && <p className="text-gray-400 text-sm">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m._id} className={`p-2 rounded max-w-xs ${m.senderRole === 'agent' ? 'bg-gray-100' : 'bg-blue-100 ml-auto'}`}>
                <p className="text-xs text-gray-500">{m.senderRole}</p>
                <p className="text-sm">{m.text}</p>
              </div>
            ))}
          </div>
          {ticket.status !== 'Resolved' ? (
            <form onSubmit={sendMessage} className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)}
                className="flex-1 px-3 py-2 border rounded" placeholder="Type a message..." />
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

export default CustomerTicketDetail;