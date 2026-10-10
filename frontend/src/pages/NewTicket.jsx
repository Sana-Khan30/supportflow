import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowLeft, Send, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Input, { Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ButtonLoader } from '../components/ui/Loader';

const CATEGORIES = [
  'Gardening',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Cleaning',
  'Painting',
  'AC Repair',
  'Billing',
  'Authentication',
  'Technical / Bug',
  'Performance',
  'Feature Request',
  'General',
  'Other'
];

const NewTicket = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingIdParam = searchParams.get('bookingId') || '';
  const categoryParam = searchParams.get('category') || 'General';
  const subjectParam = searchParams.get('subject') || '';

  const [form, setForm] = useState({
    subject: subjectParam,
    description: '',
    category: CATEGORIES.includes(categoryParam) ? categoryParam : 'General',
    bookingId: bookingIdParam
  });
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isOther = form.category === 'Other';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        subject: form.subject,
        description: form.description,
        category: isOther ? (customCategory.trim() || 'Other') : form.category,
        bookingId: form.bookingId || undefined
      };
      const res = await api.post('/tickets', payload);
      navigate(`/customer/tickets/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900 pb-16">
      <Navbar />

      <main className="p-4 sm:p-6 max-w-xl mx-auto">
        <button
          onClick={() => navigate('/customer')}
          className="text-xs font-mono text-ink-500 hover:text-ink-900 mb-4 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={13} />
          Back to Customer Hub
        </button>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100">
              <div>
                <h1 className="font-display text-xl font-bold text-ink-900">
                  File a Complaint / Support Ticket
                </h1>
                <p className="text-xs text-ink-400 font-mono mt-0.5">
                  Multi-dimensional AI triage & verified specialist routing
                </p>
              </div>
              <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">
                NEW INTAKE
              </span>
            </div>

            {/* Linked Booking Notice if filing against an appointment */}
            {form.bookingId && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-950 font-mono">
                <LinkIcon size={15} className="text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold">Linked to Appointment: </span>
                  <span className="text-indigo-800 font-normal">{form.bookingId}</span>
                </div>
              </div>
            )}

            {/* AI Intake Notice */}
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
              <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5 font-display">Instant AI Multi-Dimensional Triage</span>
                <p className="text-ink-600 leading-relaxed font-sans text-[11px]">
                  Our AI engine will immediately analyze your complaint for sentiment, priority level, urgency score, and extract key facts before routing to a specialist.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl font-mono">
                  {error}
                </p>
              )}

              <Input
                label="Issue Summary / Subject *"
                placeholder="e.g. Incomplete lawn mowing, leaking faucet after repair, billing mismatch"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />

              <Textarea
                label="Detailed Description *"
                placeholder="Provide specific details regarding the problem, what went wrong, or what assistance you need..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-medium text-ink-700">Service / Inquiry Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-ink-200 bg-slate-50 px-3.5 py-2.5 text-xs text-ink-900 focus:border-ink-900 focus:bg-white focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {isOther && (
                <Input
                  label="Specify Category Name *"
                  placeholder="e.g. Special Restoration, Equipment Damage"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              )}

              <Button type="submit" size="lg" className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
                {loading ? <ButtonLoader label="Triaging with AI..." /> : 'Submit Support Ticket'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewTicket;