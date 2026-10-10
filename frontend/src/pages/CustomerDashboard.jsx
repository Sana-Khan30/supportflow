import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus, Search, MessageSquare, Clock, ArrowRight, Trash2,
  Calendar, ShieldCheck, AlertCircle, Wrench, CheckCircle2,
  Sparkles, Star, User, MapPin, DollarSign, ChevronRight
} from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';
import ServiceMarketplace from '../components/ServiceMarketplace';

const PAGE_SIZE = 6;

const BookingCard = ({ booking, onRaiseComplaint }) => {
  const isCompleted = booking.status === 'Completed';
  const isAccepted = booking.status === 'Accepted';
  const isInProgress = booking.status === 'In Progress';

  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-ink-800 border border-slate-200">
              #{booking.bookingNumber || 'BK-APPT'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              {booking.serviceCategory || 'Service'}
            </span>
            <span className="text-[11px] font-mono text-ink-400">
              {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h3 className="font-display font-bold text-base text-ink-900">
            {booking.serviceTitle || `${booking.serviceCategory} Appointment`}
          </h3>

          <p className="text-xs text-ink-500 font-sans flex items-center gap-1.5">
            <MapPin size={12} className="text-rose-500 shrink-0" />
            <span>{booking.location || 'On-site'}</span>
            <span className="text-ink-300">•</span>
            <Clock size={12} className="text-indigo-500 shrink-0" />
            <span>{booking.timeSlot || '10:00 AM - 12:00 PM'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={booking.urgency || 'Medium'} size="sm" />
          <StatusBadge status={booking.status} size="sm" />
        </div>
      </div>

      {/* Specialist / Provider Details */}
      {booking.agent && (
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold font-mono text-xs flex items-center justify-center">
              {booking.agent.name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="font-bold text-ink-900">{booking.agent.name}</p>
              <p className="text-[11px] text-ink-500 font-sans">
                {booking.agent.businessName || 'Verified Specialist'} • ⭐ {booking.agent.rating || 4.9}
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <p className="text-[10px] text-ink-400">Rate</p>
            <p className="font-bold text-ink-900">₨ {booking.pricePerHour || 1500} / hr</p>
          </div>
        </div>
      )}

      {/* Resolution Note if completed */}
      {isCompleted && booking.resolutionNote && (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1">
          <p className="font-mono text-[10px] uppercase font-bold text-emerald-900 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-700" /> Specialist Resolution Memorandum:
          </p>
          <p className="text-emerald-950 font-sans leading-relaxed">{booking.resolutionNote}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-mono text-ink-400">
          {isCompleted ? '✓ Completed session' : isInProgress ? '⚡ Work currently in progress' : isAccepted ? 'Specialist confirmed date' : 'Awaiting specialist confirmation'}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRaiseComplaint(booking)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          >
            <AlertCircle size={13} />
            <span>Need Help? File AI Complaint</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const TicketCard = ({ ticket, onDelete }) => (
  <Link
    to={`/customer/tickets/${ticket._id}`}
    className="group relative flex bg-white border border-ink-100 rounded-xl overflow-hidden shadow-2xs hover:border-ink-300 hover:shadow-md transition-all"
  >
    <div
      className={`w-1.5 shrink-0 ${
        ticket.priority === 'High'
          ? 'bg-rose-500'
          : ticket.priority === 'Low'
          ? 'bg-teal-500'
          : 'bg-amber-500'
      }`}
    />
    <div className="flex-1 px-5 py-4">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200/50">
              #{ticket.ticketNumber}
            </span>
            <span className="text-[11px] font-mono text-ink-400">
              {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-[10px] font-mono text-ink-500 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
              {ticket.category}
            </span>
            {ticket.sentiment && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                ticket.sentiment === 'Frustrated' ? 'bg-rose-100 text-rose-800' :
                ticket.sentiment === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                {ticket.sentiment}
              </span>
            )}
          </div>

          <h3 className="font-display font-semibold text-sm text-ink-900 truncate">
            {ticket.subject}
          </h3>

          <p className="text-xs text-ink-500 mt-1 line-clamp-1 font-sans">
            {ticket.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PriorityBadge priority={ticket.priority} size="sm" />
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </div>

      {ticket.status === 'Resolved' && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-emerald-700">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} /> Resolution Memorandum issued
          </span>
          <span className="text-ink-400 group-hover:text-ink-900 transition-colors flex items-center gap-0.5">
            View details <ChevronRight size={12} />
          </span>
        </div>
      )}
    </div>

    {ticket.status !== 'Resolved' && (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(ticket._id);
        }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-ink-300 hover:text-rose-600 transition-all cursor-pointer"
        title="Delete ticket"
      >
        <Trash2 size={13} />
      </button>
    )}
  </Link>
);

const CustomerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'tickets' | 'marketplace'
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        api.get('/tickets/my'),
        api.get('/bookings/my')
      ]);
      setTickets(tRes.data || []);
      setBookings(bRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRaiseComplaint = (booking) => {
    navigate(`/customer/new?bookingId=${booking._id}&category=${encodeURIComponent(booking.serviceCategory || 'General')}&subject=${encodeURIComponent('Dispute / Service Issue with Booking #' + booking.bookingNumber)}`);
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await api.delete(`/tickets/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      toast.success('Ticket deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.subject?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.ticketNumber?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  });

  const pagedTickets = filteredTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const ticketPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900 pb-16">
      <Navbar />

      <main className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-ink-100 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Customer Hub
            </span>
            <h1 className="font-display text-2xl font-bold text-ink-900 mt-1">
              Service Bookings & Resolution Portal
            </h1>
            <p className="text-xs text-ink-500 font-sans mt-0.5">
              Manage scheduled visits, rate completed work, and monitor AI complaint triage.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setActiveTab('marketplace')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Calendar size={14} /> Book Service
            </Button>
            <Button
              onClick={() => navigate('/customer/new')}
              size="sm"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus size={14} /> New Complaint Ticket
            </Button>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 border-b border-ink-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-ink-200 hover:bg-slate-50'
            }`}
          >
            <Calendar size={14} />
            <span>My Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-ink-200 hover:bg-slate-50'
            }`}
          >
            <MessageSquare size={14} />
            <span>AI Support Tickets ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'marketplace'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-ink-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={14} />
            <span>Explore Services</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-ink-400 font-mono text-xs">
                Loading appointments...
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-12 text-center space-y-3">
                <Calendar size={32} className="mx-auto text-ink-300" />
                <h3 className="font-display font-semibold text-sm text-ink-800">
                  No service appointments booked yet
                </h3>
                <p className="text-xs text-ink-400 max-w-sm mx-auto">
                  Browse our verified specialists in Gardening, Plumbing, Electrical, and more to schedule your first visit.
                </p>
                <Button size="sm" onClick={() => setActiveTab('marketplace')}>
                  Browse Service Marketplace
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((b) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    onRaiseComplaint={handleRaiseComplaint}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets by subject, category, #..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-ink-200 rounded-xl text-xs focus:ring-2 focus:ring-ink-900 shadow-2xs"
              />
              <Search size={14} className="absolute left-3 top-3 text-ink-400" />
            </div>

            {loading && (
              <div className="text-center py-12 text-ink-400 font-mono text-xs">
                Loading tickets...
              </div>
            )}

            {!loading && filteredTickets.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-12 text-center space-y-3">
                <MessageSquare size={32} className="mx-auto text-ink-300" />
                <h3 className="font-display font-semibold text-sm text-ink-800">
                  No active support tickets found
                </h3>
                <p className="text-xs text-ink-400 max-w-sm mx-auto">
                  Submit a complaint or inquiry and our multi-dimensional AI triage will classify and route it immediately.
                </p>
                <Button size="sm" onClick={() => navigate('/customer/new')}>
                  Create Support Ticket
                </Button>
              </div>
            )}

            <div className="grid gap-3">
              {pagedTickets.map((t) => (
                <TicketCard
                  key={t._id}
                  ticket={t}
                  onDelete={deleteTicket}
                />
              ))}
            </div>

            <Pagination page={page} totalPages={ticketPages} onChange={setPage} />
          </div>
        )}

        {/* TAB 3: MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <div className="space-y-4">
            <ServiceMarketplace
              onSelectBooking={() => {
                fetchDashboardData();
                setActiveTab('bookings');
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;