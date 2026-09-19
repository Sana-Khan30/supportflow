import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Button from '../components/ui/Button';

const AgentTicketDetail = () => {
  const { id } = useParams();
  const { socket, isConnected, joinTicket, leaveTicket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [edit, setEdit] = useState({ category: '', priority: '', aiSummary: '' });
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/messages/${id}`)
      ]);
      setTicket(tRes.data);
      setEdit({
        category: tRes.data.category || '',
        priority: tRes.data.priority || 'Medium',
        aiSummary: tRes.data.aiSummary || '',
      });
      setMessages(mRes.data);
    } catch (err) {
      console.error('Failed to load agent ticket:', err);
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  // Real-time socket room and event listeners (no polling)
  useEffect(() => {
    if (!socket || !id) return;

    joinTicket(id);

    const handleNewMessage = (newMsg) => {
      const msgTicketId = newMsg.ticket?._id || newMsg.ticket;
      if (msgTicketId?.toString() !== id.toString()) return;

      setMessages((prev) => {
        const existingIdx = prev.findIndex(
          (m) => m._id === newMsg._id || (m._id?.startsWith?.('temp-') && m.text === newMsg.text)
        );
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = newMsg;
          return updated;
        }
        return [...prev, newMsg];
      });
    };

    const handleAiTyping = (data) => {
      setAiTyping(Boolean(data?.typing));
    };

    const handleTicketUpdated = (updatedTicket) => {
      if (updatedTicket._id?.toString() === id.toString()) {
        setTicket((prev) => ({ ...prev, ...updatedTicket }));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('ai_typing', handleAiTyping);
    socket.on('ticket_updated', handleTicketUpdated);

    return () => {
      leaveTicket(id);
      socket.off('new_message', handleNewMessage);
      socket.off('ai_typing', handleAiTyping);
      socket.off('ticket_updated', handleTicketUpdated);
    };
  }, [socket, id, joinTicket, leaveTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiTyping]);

  const assignToMe = async () => {
    setError('');
    try {
      const res = await api.patch(`/tickets/${id}/assign`);
      setTicket(res.data);
      setSuccess('Ticket assigned to you');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign ticket');
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/tickets/${id}`, edit);
      setTicket(res.data);
      setSuccess('Details updated successfully');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status) => {
    setError('');
    setSuccess('');
    try {
      const body = { status };
      if (status === 'Resolved') {
        if (!resolutionNote.trim()) {
          setError('A resolution note is required to resolve this ticket.');
          return;
        }
        body.resolutionNote = resolutionNote.trim();
      }

      const res = await api.patch(`/tickets/${id}`, body);
      setTicket(res.data);
      setSuccess(`Status changed to ${status}`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messageText = text.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderRole: 'agent',
      text: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText('');

    try {
      const res = await api.post(`/messages/${id}`, { text: messageText });
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? res.data : m))
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setError('Failed to dispatch message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-ink-400 font-mono text-sm">
          Loading ticket details...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-signal-coral font-bold text-lg mb-2">Ticket Not Found</p>
          <Link to="/agent">
            <Button variant="outline" size="sm">Back to Agent Desk</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isResolved = ticket.status === 'Resolved';

  return (
    <div className="min-h-screen bg-paper text-ink-900 pb-16">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* Navigation & Socket status */}
        <div className="flex items-center justify-between">
          <Link
            to="/agent"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-500 hover:text-ink-900 transition-colors"
          >
            ← Back to Agent Desk
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-signal-teal animate-pulse' : 'bg-ink-300'
              }`}
            />
            <span>{isConnected ? 'Real-time sync active' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3 bg-signal-coral/10 border border-signal-coral/30 text-signal-coral rounded-lg text-xs font-mono">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-signal-teal/10 border border-signal-teal/30 text-signal-teal rounded-lg text-xs font-mono">
            {success}
          </div>
        )}

        {/* Ticket Overview Card */}
        <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-stub">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs text-signal-amber font-semibold tracking-wider">
              #{ticket.ticketNumber}
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <h1 className="text-xl font-display font-bold text-ink-900 mb-2">
            {ticket.subject}
          </h1>
          <p className="text-ink-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
            {ticket.description}
          </p>

          {!ticket.agent && !isResolved && (
            <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
              <span className="text-xs text-ink-400 font-mono">Unassigned Ticket</span>
              <Button size="sm" variant="primary" onClick={assignToMe}>
                Claim & Assign to Me
              </Button>
            </div>
          )}

          {ticket.agent && (
            <div className="pt-3 border-t border-ink-100 text-xs text-ink-500 font-mono">
              Assigned Specialist: <strong className="text-ink-900">{ticket.agent?.name || 'Assigned'}</strong>
            </div>
          )}
        </div>

        {/* AI Suggestions & Triage Editing */}
        <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-stub space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-ink-900 flex items-center gap-1.5">
              <span>🤖</span>
              <span>AI Triage & Categorization</span>
            </h3>
            {edit.aiSummary?.includes('AI triage unavailable') && (
              <span className="text-[10px] font-mono text-signal-amber bg-signal-amber/10 px-2 py-0.5 rounded border border-signal-amber/20">
                Needs manual input
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-ink-500 mb-1">Category</label>
              <input
                type="text"
                value={edit.category}
                onChange={(e) => setEdit({ ...edit, category: e.target.value })}
                disabled={isResolved}
                className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-900 disabled:bg-paper"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-500 mb-1">Priority</label>
              <select
                value={edit.priority}
                onChange={(e) => setEdit({ ...edit, priority: e.target.value })}
                disabled={isResolved}
                className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-900 disabled:bg-paper bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-500 mb-1">Diagnosis Summary</label>
            <textarea
              value={edit.aiSummary}
              onChange={(e) => setEdit({ ...edit, aiSummary: e.target.value })}
              disabled={isResolved}
              rows="2"
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-900 disabled:bg-paper"
            />
          </div>

          {!isResolved && (
            <div className="flex justify-end pt-1">
              <Button size="sm" variant="outline" disabled={saving} onClick={saveEdit}>
                {saving ? 'Saving...' : 'Update Ticket Details'}
              </Button>
            </div>
          )}
        </div>

        {/* Status Actions (if not already resolved) */}
        {!isResolved && (
          <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-stub space-y-4">
            <h3 className="font-display font-semibold text-sm text-ink-900">
              Update Ticket Lifecycle
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {['New', 'Assigned', 'In Progress'].map((statusOption) => (
                <button
                  type="button"
                  key={statusOption}
                  onClick={() => changeStatus(statusOption)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                    ticket.status === statusOption
                      ? 'bg-ink-900 text-white shadow-xs'
                      : 'bg-paper text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {statusOption}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-500 mb-1">
                Resolution Note <span className="text-signal-coral">*</span> (required to resolve)
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows="2"
                placeholder="Explain the steps taken to resolve the customer's issue..."
                className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-900 placeholder-ink-400"
              />
            </div>

            <Button
              size="sm"
              variant="primary"
              className="bg-signal-teal hover:bg-signal-teal/90 text-white"
              onClick={() => changeStatus('Resolved')}
            >
              Resolve Ticket
            </Button>
          </div>
        )}

        {/* Live Conversation Stream */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-stub overflow-hidden">
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-paper/30">
            <h3 className="font-display font-semibold text-sm text-ink-900">
              Customer Thread
            </h3>
            <span className="text-xs font-mono text-ink-400">
              {messages.length} messages
            </span>
          </div>

          <div className="p-6 space-y-3.5 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-8 text-ink-400 text-xs font-mono">
                No conversation yet.
              </div>
            )}

            {messages.map((m) => {
              const isAgent = m.senderRole === 'agent';
              const isAI = m.senderRole === 'ai';

              return (
                <div
                  key={m._id}
                  className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-mono text-ink-400 mb-1 px-1">
                    {isAI ? '🤖 SupportFlow AI' : isAgent ? 'You (Specialist)' : 'Customer'}
                  </span>

                  <div
                    className={`px-4 py-2.5 rounded-2xl max-w-sm sm:max-w-md text-sm leading-relaxed shadow-2xs ${
                      isAgent
                        ? 'bg-ink-900 text-white rounded-br-xs'
                        : isAI
                        ? 'bg-signal-amber/10 border border-signal-amber/30 text-ink-900 rounded-bl-xs'
                        : 'bg-paper text-ink-900 border border-ink-200 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              );
            })}

            {aiTyping && (
              <div className="flex flex-col items-start animate-in fade-in duration-200">
                <span className="text-[10px] font-mono text-signal-amber font-semibold mb-1 px-1">
                  🤖 SupportFlow AI
                </span>
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-xs bg-signal-amber/10 border border-signal-amber/30 text-ink-600 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-amber animate-ping" />
                  <span className="font-mono italic">AI is generating an auto-reply...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply Form */}
          <div className="p-4 bg-paper/40 border-t border-ink-100">
            {!isResolved ? (
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Send a response to the customer..."
                  className="flex-1 px-4 py-2.5 text-sm bg-white border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-900 placeholder-ink-400"
                />
                <Button type="submit" variant="primary" disabled={!text.trim()}>
                  Reply
                </Button>
              </form>
            ) : (
              <div className="text-center py-2 text-xs font-mono text-ink-400">
                Ticket resolved — thread closed.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgentTicketDetail;