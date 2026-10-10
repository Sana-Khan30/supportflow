import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, CheckCircle2, Clock, Sparkles, User, Star, ArrowLeft, ShieldCheck, FileCheck, Check } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Button from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { useSocket } from '../context/SocketContext';

const MessageBubble = ({ m }) => {
  const isAi = m.senderRole === 'ai';
  const isCustomer = m.senderRole === 'customer';

  return (
    <div className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] font-mono text-ink-400 mb-1 px-1">
        {isCustomer ? 'You' : isAi ? '🤖 SupportFlow Assistant' : `🎧 ${m.sender?.name || 'Support Specialist'}`}
      </span>
      <div
        className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-md text-xs leading-relaxed shadow-2xs ${
          isCustomer
            ? 'bg-ink-900 text-white rounded-br-xs'
            : isAi
            ? 'bg-amber-500/10 border border-amber-500/25 text-ink-900 rounded-bl-xs'
            : 'bg-slate-100 text-ink-900 border border-slate-200 rounded-bl-xs'
        }`}
      >
        <p className="whitespace-pre-wrap">{m.text}</p>
      </div>
    </div>
  );
};

const CustomerTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [booking, setBooking] = useState(null);
  const [suggestedAgents, setSuggestedAgents] = useState([]);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoadingId, setBookingLoadingId] = useState(null);

  // Direct CSAT Review State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [aiTyping, setAiTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const loadData = async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/messages/${id}`)
      ]);
      setTicket(tRes.data);
      setMessages(mRes.data);

      if (tRes.data.customerReview?.rating) {
        setRating(tRes.data.customerReview.rating);
        setComment(tRes.data.customerReview.comment || '');
      }

      try {
        const bRes = await api.get('/bookings/my');
        const existing = bRes.data.find((b) => b.ticket?._id === id);
        setBooking(existing || null);
        if (!existing) {
          const sRes = await api.get(`/bookings/suggested/${id}`);
          setSuggestedAgents(sRes.data || []);
        }
      } catch {
        // Optional booking sync
      }
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('ticket:join', id);

    const onMessage = (m) => {
      if (m.isInternal) return;
      setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
    };
    const onAiTyping = (data) => setAiTyping(Boolean(data?.typing));
    const onTicketUpdate = (updated) =>
      setTicket((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev));

    socket.on('new_message', onMessage);
    socket.on('ai_typing', onAiTyping);
    socket.on('ticket_updated', onTicketUpdate);

    return () => {
      socket.emit('ticket:leave', id);
      socket.off('new_message', onMessage);
      socket.off('ai_typing', onAiTyping);
      socket.off('ticket_updated', onTicketUpdate);
    };
  }, [socket, id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const value = text.trim();
    setText('');
    setSending(true);
    try {
      await api.post(`/messages/${id}`, { text: value });
    } finally {
      setSending(false);
    }
  };

  const bookAgent = async (agentId) => {
    setBookingLoadingId(agentId);
    setBookingError('');
    try {
      const res = await api.post('/bookings', { ticketId: id, agentId });
      setBooking(res.data);
      loadData();
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoadingId(null);
    }
  };

  const handleSubmitDirectReview = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await api.post(`/tickets/${id}/review`, { rating, comment });
      setTicket((prev) => ({ ...prev, customerReview: res.data.review }));
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-ink-400 font-mono text-sm">
          Loading your support case...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-signal-coral font-bold text-lg mb-2">Ticket not found</p>
          <Link to="/customer">
            <Button variant="outline" size="sm">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isResolved = ticket.status === 'Resolved';
  const currentStep =
    ticket.status === 'New'
      ? 1
      : ticket.status === 'Assigned'
      ? 2
      : ticket.status === 'In Progress'
      ? 3
      : 4;

  const hasCustomerReview = ticket.customerReview?.rating > 0;

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900 pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/customer')}
            className="text-xs font-mono text-ink-500 hover:text-ink-900 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={13} />
            Back to tickets
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-400">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
            />
            <span>{isConnected ? 'Real-time updates active' : 'Connecting...'}</span>
          </div>
        </div>

        {/* 4-Stage Resolution Pipeline Tracker */}
        <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono mb-3">
            <span className="font-bold text-ink-900 uppercase">Resolution Progress</span>
            <span className="text-ink-400">Stage {currentStep} of 4</span>
          </div>

          <div className="grid grid-cols-4 gap-2 relative">
            {[
              { step: 1, label: 'Intake' },
              { step: 2, label: 'Assigned' },
              { step: 3, label: 'Investigating' },
              { step: 4, label: 'Resolved' }
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    s.step <= currentStep
                      ? 'bg-ink-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {s.step < currentStep ? <CheckCircle2 size={14} className="text-emerald-400" /> : s.step}
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 ${
                    s.step === currentStep ? 'text-ink-900 font-bold' : 'text-ink-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Details & Intake Diagnosis */}
        <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-ink-100">
            <span className="font-mono text-xs text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
              #{ticket.ticketNumber}
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <div>
            <h1 className="font-display text-xl font-bold text-ink-900 mb-1.5">
              {ticket.subject}
            </h1>
            <p className="text-ink-600 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {ticket.description}
            </p>
          </div>

          {/* AI Intake Diagnosis Summary */}
          {ticket.aiSummary && (
            <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                <Sparkles size={13} className="text-amber-600" />
                <span>Automated Intake Diagnosis</span>
              </div>
              <p className="text-ink-800">{ticket.aiSummary}</p>
            </div>
          )}
        </div>

        {/* Formal Resolution Memorandum & Action Summary Card */}
        {isResolved && (
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white rounded-xl border border-emerald-500/30 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileCheck size={16} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-emerald-950">
                    Resolution Memorandum & Action Summary
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-700">
                    Resolved by {ticket.agent?.name || 'Assigned Specialist'} ·{' '}
                    {ticket.resolvedAt
                      ? new Date(ticket.resolvedAt).toLocaleString()
                      : new Date(ticket.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                CLOSED & RESOLVED
              </span>
            </div>

            <div className="p-3.5 bg-white/90 rounded-lg border border-emerald-200/70 text-xs text-ink-800 leading-relaxed">
              <p className="font-semibold text-emerald-900 mb-1 text-[11px] font-mono uppercase tracking-wider">
                Official Action Note:
              </p>
              <p className="whitespace-pre-wrap">{ticket.resolutionNote || 'Issue addressed and resolved by support team.'}</p>
            </div>
          </div>
        )}

        {/* Direct CSAT Rating & Feedback Card */}
        {isResolved && (
          <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-ink-900">
                {hasCustomerReview ? 'Your Resolution Feedback' : 'Rate Your Resolution Experience (CSAT)'}
              </h3>
              {hasCustomerReview && (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Check size={11} /> Feedback Recorded
                </span>
              )}
            </div>

            {hasCustomerReview ? (
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs">
                <div className="flex gap-1 text-amber-500 text-lg">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={n <= ticket.customerReview.rating ? 'text-amber-500' : 'text-slate-200'}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {ticket.customerReview.comment && (
                  <p className="text-xs text-ink-700 italic">
                    "{ticket.customerReview.comment}"
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitDirectReview} className="space-y-3">
                {reviewError && (
                  <p className="text-rose-600 text-xs font-mono">{reviewError}</p>
                )}
                {reviewSuccess && (
                  <p className="text-emerald-700 text-xs font-mono">Thank you! Your rating has been recorded.</p>
                )}

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className={`text-2xl transition-transform hover:scale-110 cursor-pointer ${
                        n <= (hoverRating || rating) ? 'text-amber-500' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-mono text-ink-400 ml-2">
                    {rating > 0 ? `${rating} of 5 stars` : 'Select a rating'}
                  </span>
                </div>

                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Optional comment on response time and helpfulness..."
                />

                <Button type="submit" size="sm" disabled={rating === 0 || reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Resolution Feedback'}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Matched Support Specialists Booking (if open) */}
        {!booking && suggestedAgents.length > 0 && !isResolved && (
          <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm space-y-3">
            <h3 className="font-display font-semibold text-sm text-ink-900">
              Matched Support Specialists
            </h3>
            <p className="text-xs text-ink-500">
              Specialists certified for <strong>{ticket.category}</strong> inquiries.
            </p>
            {bookingError && (
              <p className="text-rose-600 text-xs font-mono">{bookingError}</p>
            )}
            <div className="space-y-2">
              {suggestedAgents.map((agent) => (
                <div
                  key={agent._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-ink-100 bg-slate-50/50"
                >
                  <div>
                    <p className="font-semibold text-xs text-ink-900">{agent.name}</p>
                    <p className="text-[11px] text-ink-400 font-mono">{agent.email}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={bookingLoadingId === agent._id}
                    onClick={() => bookAgent(agent._id)}
                  >
                    {bookingLoadingId === agent._id ? 'Booking...' : 'Book Specialist'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Conversation Thread */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-ink-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-display font-semibold text-xs text-ink-900">
              Conversation Thread
            </h3>
            <span className="text-[11px] font-mono text-ink-400">
              {messages.length} messages
            </span>
          </div>

          <div className="p-6 space-y-3.5 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-8 text-ink-400 font-mono text-xs">
                Send a message to update the support team.
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m._id} m={m} />
            ))}

            {aiTyping && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-mono text-amber-600 font-semibold mb-1 px-1">
                  🤖 Support Assistant
                </span>
                <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-ink-600 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="font-mono italic">Drafting answer...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Reply Form */}
          <div className="p-4 bg-slate-50/70 border-t border-ink-100">
            {!isResolved ? (
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a reply or question..."
                  className="flex-1 px-4 py-2 text-xs bg-white border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-900 placeholder-ink-400"
                />
                <Button type="submit" disabled={sending || !text.trim()}>
                  <Send size={13} />
                </Button>
              </form>
            ) : (
              <div className="text-center py-2 text-xs font-mono text-ink-400">
                Ticket resolved. Conversation thread is closed.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerTicketDetail;