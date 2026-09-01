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
  const pollRef = useRef(null);

  const loadData = async () => {
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
        } catch { /* no review yet */ }
      }
    } catch {
      // Booking feature unavailable — ignore silently
    }
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

        {!booking && suggestedAgents.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Suggested Workers</h3>
            {bookingError && <p className="text-red-500 text-sm mb-3">{bookingError}</p>}
            <div className="space-y-2">
              {suggestedAgents.map((a) => (
                <div key={a._id} className="flex justify-between items-center border rounded p-3">
                  <div>
                    <p className="font-medium text-gray-800">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.email}</p>
                    {a.skills?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{a.skills.join(', ')}</p>
                    )}
                  </div>
                  <button onClick={() => bookAgent(a._id)} disabled={bookingLoadingId === a._id}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                    {bookingLoadingId === a._id ? 'Booking...' : 'Book'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking && (
          <div className="bg-white p-6 rounded-lg shadow mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Your Booking</h3>
            <p className="text-sm text-gray-600">Worker: <strong>{booking.agent?.name}</strong></p>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={booking.status} />
              <PriorityBadge priority={booking.urgency} />
            </div>
          </div>
        )}

        {booking?.status === 'Completed' && (
          <div className="bg-white p-6 rounded-lg shadow mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              {review ? 'Your Review' : 'Rate your experience'}
            </h3>
            {review ? (
              <div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= review.rating ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}>★</span>
                  ))}
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ) : (
              <form onSubmit={submitReview}>
                {reviewError && <p className="text-red-500 text-sm mb-2">{reviewError}</p>}
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onClick={() => setRating(n)}
                      className={`text-2xl ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                  ))}
                </div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  rows="2" className="w-full mb-3 px-3 py-2 border rounded" placeholder="Optional comment..." />
                <button type="submit" disabled={rating === 0 || reviewSubmitting}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50">
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-3">Conversation</h3>
          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
            {messages.length === 0 && <p className="text-gray-400 text-sm">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m._id} className={`p-2 rounded max-w-xs ${
                m.senderRole === 'ai' ? 'bg-purple-100' :
                m.senderRole === 'agent' ? 'bg-gray-100' : 'bg-blue-100 ml-auto'
              }`}>
                <p className="text-xs text-gray-500">
                  {m.senderRole === 'ai' ? '🤖 AI Assistant' : m.senderRole}
                </p>
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