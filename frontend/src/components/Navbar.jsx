import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Logo from './ui/Logo';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const homePath = user?.role === 'admin' ? '/admin' : user?.role === 'agent' ? '/agent' : '/customer';

  return (
    <nav className="bg-white border-b border-ink-100 px-6 py-3 flex justify-between items-center sticky top-0 z-30 shadow-xs">
      <Link to={homePath} className="hover:opacity-90 transition-opacity">
        <Logo size="sm" />
      </Link>

      <div className="flex items-center gap-4">
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="hidden sm:inline-block text-xs font-mono font-medium px-2.5 py-1 bg-ink-50 text-ink-700 rounded-md border border-ink-200 hover:bg-ink-100 transition"
          >
            Admin Panel
          </Link>
        )}

        {/* Live Notification Bell */}
        <NotificationBell />

        {/* User Info */}
        <div className="text-right leading-tight hidden sm:block">
          <p className="text-sm text-ink-900 font-medium">{user?.name}</p>
          <p className="text-xs text-ink-400 font-mono uppercase">{user?.role}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;