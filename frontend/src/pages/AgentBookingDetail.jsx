import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const ALLOWED_URGENCY = ['Low', 'Medium', 'High'];

const AgentBookingDetail = () => {
  const { id } = useParams();
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
      clearInterval(pollRef.current); // stop hammering a route that will never succeed
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

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!booking) return <div className="p-8 text-red-500">Booking not found</div>;

  const isFinal = ['Rejected', 'Completed'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        {error && <p className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</p>}

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-gray-400">{booking.ticket?.ticketNumber}</p>
              <h2 className="text-xl font-bold text-gray-800">{booking.ticket?.subject}</h2>
              <p className="text-sm text-gray-500 mt-1">Customer: {booking.customer?.name} ({booking.customer?.email})</p>
            </div>
            <div className="flex gap-2">
              <PriorityBadge priority={booking.urgency} />
              <StatusBadge status={booking.status} />
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-3">{booking.ticket?.description}</p>
          {booking.ticket?.aiSummary && (
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mt-3">
              <strong>AI Summary:</strong> {booking.ticket.aiSummary}
            </div>
          )}
        </div>

        {booking.status === 'Pending' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-3">New Booking Request</h3>
            <div className="flex gap-3">
              <button onClick={accept} disabled={acting}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50">
                Accept
              </button>
              <button onClick={reject} disabled={acting}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50">
                Reject
              </button>
            </div>
          </div>
        )}

        {!isFinal && booking.status !== 'Pending' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-3">Urgency</h3>
            <div className="flex gap-2 mb-4">
              {ALLOWED_URGENCY.map((u) => (
                <button key={u} onClick={() => setUrgency(u)}
                  className={`px-3 py-1 rounded text-sm ${booking.urgency === u ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  {u}
                </button>
              ))}
            </div>

            <h3 className="font-semibold text-gray-800 mb-3">Status</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              <button onClick={() => changeStatus('In Progress')} disabled={booking.status !== 'Accepted'}
                className={`px-3 py-1 rounded text-sm ${booking.status === 'In Progress' ? 'bg-blue-600 text-white' : 'bg-gray-200'} disabled:opacity-40`}>
                In Progress
              </button>
            </div>
            <label className="block text-sm text-gray-600 mb-1">Resolution Note (required to complete)</label>
            <textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)}
              rows="2" className="w-full mb-2 px-3 py-2 border rounded" placeholder="Describe the work done..." />
            <button onClick={() => changeStatus('Completed')} disabled={booking.status !== 'In Progress'}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-40">
              Mark Completed
            </button>
          </div>
        )}

        {booking.status === 'Completed' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">Resolution Note</h3>
            <p className="text-sm text-gray-600 mb-4">{booking.resolutionNote || '—'}</p>
            <h3 className="font-semibold text-gray-800 mb-2">Customer Review</h3>
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
              <p className="text-sm text-gray-400">No review submitted yet.</p>
            )}
          </div>
        )}

        {booking.status === 'Rejected' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">This booking was rejected.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentBookingDetail;