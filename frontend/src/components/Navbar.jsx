import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">SupportFlow</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name} ({user?.role})</span>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;