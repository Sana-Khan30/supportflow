import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Button from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';

const ALLOWED_URGENCY = ['Low', 'Medium', 'High'];

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-ink-100 rounded-md p-6 ${className}`}>{children}</div>
);

const AgentBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const pollRef = useRef(null);

  const loadData = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
      if (res.data.status === 'Completed') {
        try {
          const rRes = await api.get(`/bookings/${id}/review`);
          setReview(rRes.data);
        } catch { /* no review yet */ }
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking');
      if (err.response?.status === 403 || err.response?.status === 404) {
        clearInterval(pollRef.current);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    pollRef.current = setInterval(loadData, 3000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  const accept = async () => {
    setActing(true);
    setError('');
    try {
      const res = await api.patch(`/bookings/${id}/accept`);
      setBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept');
    } finally {
      setActing(false);
    }
  };

  const reject = async () => {
    if (!window.confirm('Reject this booking?')) return;
    setActing(true);
    setError('');
    try {
      const res = await api.patch(`/bookings/${id}/reject`);
      setBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActing(false);
    }
  };

  const setUrgency = async (urgency) => {
    setError('');
    try {
      const res = await api.patch(`/bookings/${id}/urgency`, { urgency });
      setBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update urgency');
    }
  };

  const changeStatus = async (status) => {
    setError('');
    try {
      const body = { status };
      if (status === 'Completed') body.resolutionNote = resolutionNote;
      const res = await api.patch(`/bookings/${id}/status`, body);
      setBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="min-h-screen bg-paper p-8 text-ink-400">Loading…</div>;
  if (!booking) return <div className="min-h-screen bg-paper p-8 text-signal-coral">Booking not found</div>;

  const isFinal = ['Rejected', 'Completed'].includes(booking.status);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="text-sm text-ink-400 hover:text-ink-900">
          ← Back
        </button>
        {error && <p className="bg-signal-coral-dim text-signal-coral p-2.5 rounded-md text-sm">{error}</p>}

        <div className="flex bg-white border border-ink-100 rounded-md overflow-hidden shadow-stub">
          <div className={`w-1.5 shrink-0 ${
            booking.urgency === 'High' ? 'bg-signal-coral' : booking.urgency === 'Low' ? 'bg-signal-teal' : 'bg-signal-amber'
          }`} />
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-mono text-xs text-ink-400">{booking.ticket?.ticketNumber}</p>
                <h2 className="font-display text-xl font-bold text-ink-900 mt-0.5">{booking.ticket?.subject}</h2>
                <p className="text-sm text-ink-400 mt-1">
                  Customer: {booking.customer?.name} ({booking.customer?.email})
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <PriorityBadge priority={booking.urgency} />
                <StatusBadge status={booking.status} />
              </div>
            </div>
            <p className="text-ink-600 text-sm mt-3">{booking.ticket?.description}</p>
            {booking.ticket?.aiSummary && (
              <div className="bg-ink-50 p-3 rounded-md text-sm text-ink-700 mt-3">
                <strong>AI summary:</strong> {booking.ticket.aiSummary}
              </div>
            )}
          </div>
        </div>

        {booking.status === 'Pending' && (
          <Card>
            <h3 className="font-display font-semibold text-ink-900 mb-3">New booking request</h3>
            <div className="flex gap-3">
              <Button className="!bg-signal-teal" onClick={accept} disabled={acting}>Accept</Button>
              <Button variant="danger" onClick={reject} disabled={acting}>Reject</Button>
            </div>
          </Card>
        )}

        {!isFinal && booking.status !== 'Pending' && (
          <Card>
            <h3 className="font-display font-semibold text-ink-900 mb-3">Urgency</h3>
            <div className="flex gap-2 mb-6">
              {ALLOWED_URGENCY.map((u) => (
                <button
                  key={u}
                  onClick={() => setUrgency(u)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    booking.urgency === u ? 'bg-ink-900 text-paper' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <h3 className="font-display font-semibold text-ink-900 mb-3">Status</h3>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => changeStatus('In Progress')}
                disabled={booking.status !== 'Accepted'}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 ${
                  booking.status === 'In Progress' ? 'bg-ink-900 text-paper' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                }`}
              >
                In Progress
              </button>
            </div>
            <Textarea
              label="Resolution note (required to complete)"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={2}
              placeholder="Describe the work done…"
              className="mb-3"
            />
            <Button
              className="!bg-signal-teal"
              onClick={() => changeStatus('Completed')}
              disabled={booking.status !== 'In Progress'}
            >
              Mark completed
            </Button>
          </Card>
        )}

        {booking.status === 'Completed' && (
          <Card>
            <h3 className="font-display font-semibold text-ink-900 mb-2">Resolution note</h3>
            <p className="text-sm text-ink-600 mb-5">{booking.resolutionNote || '—'}</p>
            <h3 className="font-display font-semibold text-ink-900 mb-2">Customer review</h3>
            {review ? (
              <div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= review.rating ? 'text-signal-amber text-xl' : 'text-ink-200 text-xl'}>★</span>
                  ))}
                </div>
                {review.comment && <p className="text-sm text-ink-600">{review.comment}</p>}
              </div>
            ) : (
              <p className="text-sm text-ink-300">No review submitted yet.</p>
            )}
          </Card>
        )}

        {booking.status === 'Rejected' && (
          <Card>
            <p className="text-sm text-ink-400">This booking was rejected.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AgentBookingDetail;
