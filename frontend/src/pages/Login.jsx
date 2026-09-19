import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState('');
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'agent' ? '/agent' : '/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setError('');
    setDemoLoading(role);
    try {
      const user = await demoLogin(role);
      navigate(user.role === 'agent' ? '/agent' : '/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login unavailable right now');
    } finally {
      setDemoLoading('');
    }
  };

  const busy = loading || !!demoLoading;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      serial="ENTRY-0247"
      stamped={busy}
      stampLabel="VERIFYING"
      footnote="This pass signs you back into your queue — open tickets, bookings, and conversations pick up right where you left them."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="flex items-center gap-2 text-sm text-signal-coral bg-signal-coral-dim px-3 py-2.5 rounded-md">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </p>
        )}
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-[34px] text-ink-300 hover:text-ink-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <Button type="submit" size="lg" className="w-full mt-2" disabled={busy}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-paper/40 border-t-paper rounded-full animate-spin" />
              Logging in…
            </span>
          ) : (
            'Log in'
          )}
        </Button>
        <p className="text-sm text-center text-ink-400">
          No account?{' '}
          <Link to="/register" className="text-ink-900 font-medium hover:underline">
            Register
          </Link>
        </p>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-ink-100" />
          <span className="text-xs text-ink-400">or use a demo pass</span>
          <div className="flex-1 h-px bg-ink-100" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemo('customer')}
            disabled={busy}
          >
            {demoLoading === 'customer' ? '…' : 'Continue as customer'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemo('agent')}
            disabled={busy}
          >
            {demoLoading === 'agent' ? '…' : 'Continue as agent'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;