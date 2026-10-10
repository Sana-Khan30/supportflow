import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Lock,
  History,
  Send,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SentimentBadge from '../components/SentimentBadge';
import AIPanel from '../components/ui/AIPanel';
import AuditTimeline from '../components/ui/AuditTimeline';
import DuplicateRadar from '../components/ui/DuplicateRadar';
import KnowledgeCopilot from '../components/ui/KnowledgeCopilot';
import Button from '../components/ui/Button';

const AgentTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected, joinTicket, leaveTicket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [queueTickets, setQueueTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'internal' | 'timeline'
  const [text, setText] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load ticket, queue, and conversation
  const loadData = async () => {
    try {
      const [tRes, mRes, qRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/messages/${id}`),
        api.get('/tickets')
      ]);
      setTicket(tRes.data);
      setMessages(mRes.data);
      setQueueTickets(qRes.data || []);
      if (tRes.data.resolutionNote) {
        setResolutionNote(tRes.data.resolutionNote);
      }
    } catch (err) {
      console.error('Failed to load agent workspace:', err);
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Real-time socket events
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
  }, [messages, aiTyping, activeTab]);

  const assignToMe = async () => {
    setError('');
    try {
      const res = await api.patch(`/tickets/${id}/assign`);
      setTicket(res.data);
      setSuccess('Ticket successfully assigned to you.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign ticket');
    }
  };

  const handleUpdateTriage = async (triageData) => {
    try {
      const res = await api.patch(`/tickets/${id}/triage`, triageData);
      setTicket(res.data);
      setSuccess('AI triage classifications verified & updated.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update triage');
    }
  };

  const changeStatus = async (status, note = '') => {
    setError('');
    try {
      const body = { status };
      if (status === 'Resolved') {
        if (!note.trim() && !resolutionNote.trim()) {
          setError('A resolution note is required to resolve this ticket.');
          return;
        }
        body.resolutionNote = note.trim() || resolutionNote.trim();
      }

      const res = await api.patch(`/tickets/${id}`, body);
      setTicket(res.data);
      setShowResolveModal(false);
      setSuccess(`Ticket transitioned to ${status}.`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSendMessage = async (e, isInternal = false) => {
    if (e) e.preventDefault();
    if (!text.trim() || sendingMessage) return;

    const messageText = text.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      senderRole: 'agent',
      text: messageText,
      isInternal,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimistic]);
    setText('');
    setSendingMessage(true);

    try {
      const res = await api.post(`/messages/${id}`, {
        text: messageText,
        isInternal
      });
      setMessages((prev) => prev.map((m) => (m._id === tempId ? res.data : m)));
      if (isInternal) {
        // Refresh ticket to sync activity log
        api.get(`/tickets/${id}`).then((r) => setTicket(r.data));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleInsertCopilotDraft = (draftText) => {
    setText(draftText);
    setActiveTab('chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 font-mono text-sm text-slate-400">
          Loading command center workspace...
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
  const customerMessages = messages.filter((m) => !m.isInternal);
  const internalNotes = messages.filter((m) => m.isInternal);

  // SLA Calculation
  const isSlaBreached = ticket.slaDeadline && new Date() > new Date(ticket.slaDeadline) && !isResolved;
  const slaDateStr = ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-ink-900">
      <Navbar />

      {/* Command Center Top Bar */}
      <header className="bg-white border-b border-ink-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            to="/agent"
            className="p-1.5 rounded-lg border border-ink-100 hover:bg-slate-50 text-ink-600 transition-colors"
            title="Back to queue"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                #{ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <SentimentBadge sentiment={ticket.sentiment || 'Neutral'} />
            </div>
            <h1 className="font-display text-base font-bold text-ink-900 truncate max-w-lg mt-1">
              {ticket.subject}
            </h1>
          </div>
        </div>

        {/* Quick Actions & SLA */}
        <div className="flex items-center gap-3">
          {/* SLA Clock */}
          {ticket.slaDeadline && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border ${
                isSlaBreached
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Clock size={13} className={isSlaBreached ? 'text-rose-600' : 'text-slate-500'} />
              <span>
                {isSlaBreached ? 'SLA Breached' : `Target: ${slaDateStr}`}
              </span>
            </div>
          )}

          {!ticket.agent && !isResolved ? (
            <Button size="sm" variant="primary" onClick={assignToMe}>
              Claim Ticket
            </Button>
          ) : (
            <span className="text-xs font-mono text-ink-500 bg-slate-50 px-2.5 py-1.5 rounded border border-ink-100">
              Agent: <strong>{ticket.agent?.name || 'Assigned'}</strong>
            </span>
          )}

          {!isResolved && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-mono text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 size={14} />
              Resolve Ticket
            </button>
          )}
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-mono">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-mono">
          {success}
        </div>
      )}

      {/* 3-Pane Operations Workspace Grid */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-6 max-w-[1600px] w-full mx-auto">
        {/* LEFT PANE: Live Queue Quick-Switcher (Col 1-3) */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-xs text-ink-900 uppercase tracking-wider">
                Live Queue ({queueTickets.length})
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live sync" />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {queueTickets.map((t) => {
                const isCurrent = t._id === ticket._id;
                return (
                  <Link
                    key={t._id}
                    to={`/agent/tickets/${t._id}`}
                    className={`block p-3 rounded-lg border transition-all text-xs ${
                      isCurrent
                        ? 'border-ink-900 bg-slate-50 shadow-xs'
                        : 'border-ink-100 bg-white hover:border-ink-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[11px] font-bold text-ink-900">
                        #{t.ticketNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        <PriorityBadge priority={t.priority} size="sm" />
                      </div>
                    </div>
                    <p className="font-medium text-ink-800 truncate mb-1">{t.subject}</p>
                    <div className="flex items-center justify-between text-[10px] text-ink-400 font-mono">
                      <span>{t.category}</span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* CENTER PANE: Conversation, Internal Notes, Timeline & Composer (Col 4-8) */}
        <main className="col-span-12 lg:col-span-6 flex flex-col bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden min-h-[680px]">
          {/* Ticket Description Card Header */}
          <div className="p-5 border-b border-ink-100 bg-slate-50/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] text-ink-400">
                  Opened by <strong>{ticket.customer?.name}</strong> ({ticket.customer?.email}) ·{' '}
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
                <p className="text-sm text-ink-800 leading-relaxed mt-2 whitespace-pre-wrap font-sans">
                  {ticket.description}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-ink-100 bg-white px-5 pt-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-2.5 px-3 text-xs font-semibold font-display border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'border-ink-900 text-ink-900'
                  : 'border-transparent text-ink-400 hover:text-ink-700'
              }`}
            >
              <MessageSquare size={13} />
              Customer Thread ({customerMessages.length})
            </button>

            <button
              onClick={() => setActiveTab('internal')}
              className={`pb-2.5 px-3 text-xs font-semibold font-display border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'internal'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-ink-400 hover:text-ink-700'
              }`}
            >
              <Lock size={13} className="text-amber-600" />
              Internal Notes ({internalNotes.length})
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-2.5 px-3 text-xs font-semibold font-display border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'border-ink-900 text-ink-900'
                  : 'border-transparent text-ink-400 hover:text-ink-700'
              }`}
            >
              <History size={13} />
              Audit Timeline
            </button>
          </div>

          {/* Tab Content Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[500px]">
            {activeTab === 'chat' && (
              <>
                {customerMessages.length === 0 && (
                  <div className="text-center py-12 text-ink-400 font-mono text-xs">
                    No customer conversation yet. Reply below.
                  </div>
                )}

                {customerMessages.map((m) => {
                  const isAgent = m.senderRole === 'agent';
                  const isAI = m.senderRole === 'ai';

                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] font-mono text-ink-400 mb-1 px-1">
                        {isAgent ? `🎧 You (${m.sender?.name || 'Agent'})` : isAI ? '🤖 SupportFlow AI' : `👤 ${ticket.customer?.name || 'Customer'}`}
                      </span>

                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-md text-sm leading-relaxed shadow-2xs ${
                          isAgent
                            ? 'bg-ink-900 text-white rounded-br-xs'
                            : isAI
                            ? 'bg-amber-50 border border-amber-200 text-ink-900 rounded-bl-xs'
                            : 'bg-slate-100 text-ink-900 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  );
                })}

                {aiTyping && (
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-mono text-amber-600 mb-1 px-1">
                      🤖 AI Generating Auto-Reply...
                    </span>
                    <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono animate-pulse">
                      Customer is receiving instant assistance...
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'internal' && (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-mono flex items-center gap-2">
                  <Shield size={14} className="text-amber-600 shrink-0" />
                  <span>
                    Staff-Only Confidential Notes. Invisible to customers in their portal.
                  </span>
                </div>

                {internalNotes.length === 0 && (
                  <div className="text-center py-10 text-ink-400 font-mono text-xs">
                    No internal staff notes recorded yet.
                  </div>
                )}

                {internalNotes.map((n) => (
                  <div key={n._id} className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-amber-950 font-display">
                        🔒 {n.sender?.name || 'Staff Specialist'}
                      </span>
                      <span className="text-[10px] font-mono text-ink-400">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-ink-800 leading-relaxed font-sans whitespace-pre-wrap">
                      {n.text}
                    </p>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'timeline' && (
              <AuditTimeline activityLog={ticket.activityLog} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Box */}
          {activeTab !== 'timeline' && (
            <div className="p-4 bg-slate-50 border-t border-ink-100">
              {!isResolved ? (
                <form
                  onSubmit={(e) => handleSendMessage(e, activeTab === 'internal')}
                  className="space-y-2"
                >
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      placeholder={
                        activeTab === 'internal'
                          ? 'Add a private staff note (only visible to agents)...'
                          : 'Write a response to the customer...'
                      }
                      className="w-full p-3 bg-white border border-ink-200 rounded-lg text-xs focus:ring-2 focus:ring-ink-900 placeholder-ink-400 font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-ink-400">
                      {activeTab === 'internal' ? (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Lock size={11} /> Internal Note Mode
                        </span>
                      ) : (
                        <span>Public Customer Reply</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={sendingMessage || !text.trim()}
                        className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                          activeTab === 'internal'
                            ? 'bg-amber-700 hover:bg-amber-800'
                            : 'bg-ink-900 hover:bg-ink-800'
                        } disabled:opacity-50`}
                      >
                        <Send size={12} />
                        {sendingMessage ? 'Sending...' : activeTab === 'internal' ? 'Save Note' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-3 text-xs font-mono text-ink-400 bg-slate-100 rounded-lg">
                  Ticket has been resolved. Conversation thread is closed.
                </div>
              )}
            </div>
          )}
        </main>

        {/* RIGHT PANE: Multi-Dimensional AI Triage, Copilot & Duplicate Radar (Col 9-12) */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          {/* AI Triage Inspector */}
          <AIPanel
            ticket={ticket}
            onUpdateTriage={handleUpdateTriage}
            isResolved={isResolved}
          />

          {/* Duplicate & Incident Surge Radar */}
          <DuplicateRadar ticketId={ticket._id} />

          {/* Grounded Knowledge Base & Copilot */}
          <KnowledgeCopilot
            ticketId={ticket._id}
            onInsertDraft={handleInsertCopilotDraft}
          />
        </aside>
      </div>

      {/* Resolution Note Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-ink-100">
            <div className="flex items-center justify-between pb-2 border-b border-ink-100">
              <h3 className="font-display font-bold text-base text-ink-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={18} />
                Resolve Ticket #{ticket.ticketNumber}
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-ink-400 hover:text-ink-900 font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-600">
              Provide an official resolution summary. This will be stamped onto the ticket and sent to the customer.
            </p>

            <div>
              <label className="block text-xs font-mono font-medium text-ink-700 mb-1">
                Resolution Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={4}
                placeholder="Explain the resolution steps and outcome for the customer..."
                className="w-full p-3 text-xs border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 border border-ink-200 rounded-lg text-xs font-mono text-ink-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => changeStatus('Resolved', resolutionNote)}
                disabled={!resolutionNote.trim()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-mono font-semibold disabled:opacity-50"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTicketDetail;