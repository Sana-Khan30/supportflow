import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Input, { Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ButtonLoader } from '../components/ui/Loader';

const CATEGORIES = ['Billing', 'Login / Authentication', 'General', 'Feature Request', 'Bug', 'Other'];

const NewTicket = () => {
  const [form, setForm] = useState({ subject: '', description: '', category: 'General' });
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isOther = form.category === 'Other';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        category: isOther ? (customCategory.trim() || 'Other') : form.category,
      };
      const res = await api.post('/tickets', payload);
      navigate(`/customer/tickets/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="p-6 max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-ink-400 hover:text-ink-900 mb-4 inline-flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="flex bg-white border border-ink-100 rounded-md overflow-hidden shadow-stub">
          <div className="w-1.5 shrink-0 bg-signal-amber" />
          <div className="flex-1 p-7">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-xl font-bold text-ink-900">New ticket</h2>
              <span className="font-mono text-xs text-ink-300">DRAFT</span>
            </div>
            <p className="text-sm text-ink-400 mb-6">
              We'll read this automatically and route it to the right agent.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <p className="text-sm text-signal-coral bg-signal-coral-dim px-3 py-2 rounded-md">{error}</p>
              )}

              <Input
                label="Subject"
                placeholder="Short summary of the issue"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />

              <Textarea
                label="Description"
                placeholder="What happened? Include any steps to reproduce, error messages, or context that would help an agent."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-ink-900 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {isOther && (
                <Input
                  label="Describe the category"
                  placeholder="e.g. Account deletion, Integration issue"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              )}

              <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                {loading ? <ButtonLoader label="Analyzing with AI" /> : 'Submit ticket'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTicket;