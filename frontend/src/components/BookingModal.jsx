import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Button from './ui/Button';

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:30 AM - 01:30 PM',
  '02:00 PM - 04:00 PM',
  '04:30 PM - 06:30 PM',
  '07:00 PM - 09:00 PM'
];

const BookingModal = ({ provider, isOpen, onClose, onBookingCreated }) => {
  const [serviceTitle, setServiceTitle] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [location, setLocation] = useState(provider?.location || 'Gulberg III, Lahore');
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !provider) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        agentId: provider._id,
        serviceCategory: provider.category || 'General',
        serviceTitle: serviceTitle.trim() || `${provider.category} Service Session`,
        bookingDate,
        timeSlot,
        location: location.trim(),
        notes: notes.trim(),
        pricePerHour: provider.hourlyRate || 1500,
        urgency
      };

      const res = await api.post('/bookings', payload);
      toast.success(`Booking reserved with ${provider.name}!`);
      if (onBookingCreated) onBookingCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete booking. Please make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-ink-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {provider.category || 'Specialist'}
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                ⭐ {provider.rating || 4.9} ({provider.reviewCount || 10}+ reviews)
              </span>
            </div>
            <h2 className="font-display text-lg font-bold text-white">
              Reserve Appointment
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              with {provider.name} • <span className="text-amber-300">{provider.businessName || 'Verified Provider'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-ink-900 text-xs font-sans">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-mono text-xs">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Title / Purpose */}
          <div>
            <label className="block font-bold text-ink-800 mb-1">
              Service Scope / Task Description *
            </label>
            <input
              type="text"
              required
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder={`e.g. Lawn weeding & sprinkler check, pipe welding, switchboard...`}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-ink-200 rounded-xl text-xs focus:ring-2 focus:ring-ink-900 focus:bg-white"
            />
          </div>

          {/* Date & Time Slot Grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink-800 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-600" /> Appointment Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-ink-200 rounded-xl text-xs focus:ring-2 focus:ring-ink-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-ink-800 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-600" /> Preferred Time Slot *
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-ink-200 rounded-xl text-xs focus:ring-2 focus:ring-ink-900 focus:bg-white"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location / Address */}
          <div>
            <label className="block font-bold text-ink-800 mb-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-rose-500" /> Service Location / Address *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="House #, Street, Area, City"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-ink-200 rounded-xl text-xs focus:ring-2 focus:ring-ink-900 focus:bg-white"
            />
          </div>

          {/* Specific Requirements & Notes */}
          <div>
            <label className="block font-bold text-ink-800 mb-1">
              Instructions / Special Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mention gate entry instructions, specific equipment or tools needed..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-ink-200 rounded-xl text-xs focus:ring-2 focus:ring-ink-900 focus:bg-white resize-none"
            />
          </div>

          {/* Urgency Selection */}
          <div>
            <label className="block font-bold text-ink-800 mb-1.5">
              Service Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              {['Low', 'Medium', 'High'].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setUrgency(lvl)}
                  className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                    urgency === lvl
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-ink-600 border-ink-200 hover:bg-slate-50'
                  }`}
                >
                  {lvl === 'High' ? '🔥 High / Urgent' : lvl === 'Medium' ? '⚡ Standard' : '🌿 Flexible'}
                </button>
              ))}
            </div>
          </div>

          {/* Price Summary Banner */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-amber-700" />
              <div>
                <p className="font-bold text-amber-950">Standard Rate</p>
                <p className="text-[10px] text-amber-800 font-sans">Payment handled post-service inspection</p>
              </div>
            </div>
            <span className="font-display font-bold text-base text-amber-900">
              ₨ {provider.hourlyRate || 1500} / hr
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="flex items-center gap-1.5 shadow-md bg-emerald-700 hover:bg-emerald-800"
            >
              {loading ? 'Reserving...' : <><CheckCircle2 size={14} /> Confirm Reservation</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
