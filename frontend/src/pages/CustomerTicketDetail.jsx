import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send } from 'lucide-react';
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
        {isAi ? '🤖 SupportFlow AI' : isCustomer ? 'You' : '🎧 Agent'}
      </span>
      <div
        className={`px-4 py-2.5 rounded-2xl max-w-[80%] sm:max-w-sm text-sm leading-relaxed ${
          isCustomer
            ? 'bg-ink-900 text-paper rounded-br-sm'
            : isAi
            ? 'bg-signal-amber/10 border border-signal-amber/30 text-ink-900 rounded-bl-sm'
            : 'bg-paper text-ink-900 border border-ink-200 rounded-bl-sm'
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
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
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

      try {
        const bRes = await api.get('/bookings/my');
        const existing = bRes.data.find((b) => b.ticket?._id === id);
        setBooking(existing || null);
        if (!existing) {
          const sRes = await api.get(`/bookings/suggested/${id}`);
          setSuggestedAgents(sRes.data);
        } else if (existing.status === 'Completed') {
          try {
            const rRes = await api.get(`/bookings/${existing._id}/review`);
            setReview(rRes.data);
          } catch {
            // no review yet
          }
        }
      } catch {
        // Booking feature unavailable — ignore silently
      }
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  // Real-time: join this ticket's room and react to live events instead of polling.
  // Event names here must match what the backend actually emits
  // (sockets/index.js, messageController.js, ticketController.js):
  // 'new_message', 'ai_typing' ({ typing }), 'ticket_updated'
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('ticket:join', id);

    const onMessage = (m) =>
      setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
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
      // The new message arrives via the 'new_message' socket event — no manual refetch needed.
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

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await api.post(`/bookings/${booking._id}/review`, { rating, comment });
      setReview(res.data);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-ink-400 font-mono text-sm">
          Loading ticket details…
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

  return (
    <div className="min-h-screen bg-paper text-ink-900 pb-16">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-xs font-mono text-ink-500 hover:text-ink-900">
            ← Back
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-signal-teal animate-pulse' : 'bg-ink-300'}`} />
            <span>{isConnected ? 'Real-time sync active' : 'Connecting…'}</span>
          </div>
        </div>

        <div className="flex bg-white border border-ink-100 rounded-md overflow-hidden shadow-stub">
          <div className={`w-1.5 shrink-0 ${
            ticket.priority === 'High' ? 'bg-signal-coral' : ticket.priority === 'Low' ? 'bg-signal-teal' : 'bg-signal-amber'
          }`} />
          <div className="flex-1 p-6">
            <p className="font-mono text-xs text-ink-400">#{ticket.ticketNumber}</p>
            <h1 className="font-display text-xl font-bold text-ink-900 mb-2 mt-0.5">{ticket.subject}</h1>
            <div className="flex gap-2 mb-3">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs bg-ink-50 text-ink-500 px-2 py-1 rounded">{ticket.category}</span>
            </div>
            <p className="text-ink-600 text-sm mb-3 whitespace-pre-wrap">{ticket.description}</p>
            {ticket.aiSummary && (
              <div
                className={`p-3.5 rounded-lg text-xs leading-relaxed border ${
                  ticket.aiSummary.includes('AI triage unavailable')
                    ? 'bg-signal-amber/10 border-signal-amber/30 text-ink-800'
                    : 'bg-paper border-ink-200/70 text-ink-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <span>🤖</span>
                  <span>AI summary</span>
                </div>
                <p>
                  {ticket.aiSummary.includes('AI triage unavailable')
                    ? 'Pending manual review — our support team will categorize this shortly.'
                    : ticket.aiSummary}
                </p>
              </div>
            )}
          </div>
        </div>

        {!booking && suggestedAgents.length > 0 && !isResolved && (
          <div className="bg-white border border-ink-100 rounded-md p-6 shadow-stub">
            <h3 className="font-display font-semibold text-ink-900 mb-1">Recommended agents</h3>
            <p className="text-xs text-ink-500 mb-3">Matched based on your ticket's category.</p>
            {bookingError && <p className="text-signal-coral text-xs mb-3 font-mono">{bookingError}</p>}
            <div className="space-y-2.5">
              {suggestedAgents.map((agent) => (
                <div key={agent._id} className="flex items-center justify-between p-3.5 rounded-lg border border-ink-100 bg-paper/40">
                  <div>
                    <p className="font-semibold text-sm text-ink-900">{agent.name}</p>
                    <p className="text-xs text-ink-400 font-mono">{agent.email}</p>
                    {agent.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.skills.map((s, i) => (
                          <span key={i} className="text-[10px] bg-white border border-ink-100 px-1.5 py-0.5 rounded text-ink-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" disabled={bookingLoadingId === agent._id} onClick={() => bookAgent(agent._id)}>
                    {bookingLoadingId === agent._id ? 'Booking…' : 'Book'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking && (
          <div className="bg-white border border-ink-100 rounded-md p-5 shadow-stub flex items-center justify-between">
            <div>
              <h4 className="font-display font-semibold text-sm text-ink-900">Your booking</h4>
              <p className="text-xs text-ink-500 mt-0.5">Agent: <strong>{booking.agent?.name}</strong></p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.status} />
              <PriorityBadge priority={booking.urgency} />
            </div>
          </div>
        )}

        {booking?.status === 'Completed' && (
          <div className="bg-white border border-ink-100 rounded-md p-6 shadow-stub">
            <h3 className="font-display font-semibold text-ink-900 mb-3">
              {review ? 'Your review' : 'Rate your experience'}
            </h3>
            {review ? (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= review.rating ? 'text-signal-amber text-lg' : 'text-ink-200 text-lg'}>★</span>
                  ))}
                </div>
                {review.comment && (
                  <p className="text-xs text-ink-600 italic bg-paper p-3 rounded-lg border border-ink-100">
                    "{review.comment}"
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={submitReview}>
                {reviewError && <p className="text-signal-coral text-xs mb-2">{reviewError}</p>}
                <div className="flex gap-1.5 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setRating(n)}
                      className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? 'text-signal-amber' : 'text-ink-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="mb-3"
                  placeholder="Optional comment…"
                />
                <Button type="submit" size="sm" disabled={rating === 0 || reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                </Button>
              </form>
            )}
          </div>
        )}

        <div className="bg-white border border-ink-100 rounded-md shadow-stub overflow-hidden">
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-paper/30">
            <h3 className="font-display font-semibold text-sm text-ink-900">Conversation</h3>
            <span className="text-xs font-mono text-ink-400">{messages.length} messages</span>
          </div>

          <div className="p-6 space-y-3.5 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-8 text-ink-400 text-xs font-mono">
                No messages yet — send one below.
              </div>
            )}
            {messages.map((m) => <MessageBubble key={m._id} m={m} />)}
            {aiTyping && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-mono text-signal-amber font-semibold mb-1 px-1">
                  🤖 SupportFlow AI
                </span>
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-signal-amber/10 border border-signal-amber/30 text-ink-600 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-amber animate-ping" />
                  <span className="font-mono italic">drafting a reply…</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-paper/40 border-t border-ink-100">
            {!isResolved ? (
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2.5 text-sm bg-white border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-900 placeholder-ink-400"
                />
                <Button type="submit" disabled={sending || !text.trim()}>
                  <Send size={15} />
                </Button>
              </form>
            ) : (
              <div className="text-center py-2 text-xs font-mono text-ink-400">
                Ticket resolved — thread closed for new responses.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerTicketDetail;