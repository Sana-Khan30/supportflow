import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(user.role === 'agent' ? '/agent' : '/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Register</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full mb-3 px-3 py-2 border rounded" required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full mb-3 px-3 py-2 border rounded" required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full mb-3 px-3 py-2 border rounded" required />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full mb-4 px-3 py-2 border rounded">
          <option value="customer">Customer</option>
          <option value="agent">Agent</option>
        </select>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Register
        </button>
        <p className="text-sm mt-4 text-center">
          Have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;