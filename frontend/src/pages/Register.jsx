import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(user.role === 'agent' ? '/agent' : '/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up access as a customer or a support agent."
      serial="ISSUE-0118"
      stamped={loading}
      stampLabel="ISSUING"
      footnote={
        form.role === 'agent'
          ? "Agent access lets you claim tickets, chat with customers, and manage bookings."
          : "Customer access lets you open tickets, book an agent, and track replies."
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="flex items-center gap-2 text-sm text-signal-coral bg-signal-coral-dim px-3 py-2.5 rounded-md">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </p>
        )}
        <Input
          label="Name"
          placeholder="Aisha Khan"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">I am a</label>
          <div className="grid grid-cols-2 gap-2">
            {['customer', 'agent'].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`px-3.5 py-2.5 rounded-md border text-sm font-medium capitalize transition-colors ${
                  form.role === r
                    ? 'border-ink-900 bg-ink-900 text-paper'
                    : 'border-ink-100 text-ink-500 hover:border-ink-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-sm text-center text-ink-400">
          Have an account? <Link to="/login" className="text-ink-900 font-medium hover:underline">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;