import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, User, RefreshCw, LogOut, Sparkles, BarChart3, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './ui/Logo';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout, demoLogin } = useAuth();
  const navigate = useNavigate();

  const isAgent = user?.role === 'agent';
  const homePath = isAgent ? '/agent' : '/customer';

  const handleSwitchPersona = async () => {
    const targetRole = isAgent ? 'customer' : 'agent';
    try {
      const switchedUser = await demoLogin(targetRole);
      navigate(switchedUser.role === 'agent' ? '/agent' : '/customer');
    } catch (err) {
      console.error('Persona switch failed:', err);
    }
  };

  return (
    <nav className="bg-white border-b border-ink-100 px-4 sm:px-6 py-2.5 flex flex-wrap justify-between items-center sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to={homePath} className="hover:opacity-90 transition-opacity">
          <Logo size="sm" />
        </Link>

        {/* Quick Nav Links */}
        <div className="hidden md:flex items-center gap-1 pl-2 border-l border-ink-100 text-xs font-medium text-ink-600">
          <Link
            to="/"
            className="px-2.5 py-1 rounded-lg hover:bg-slate-100 hover:text-ink-900 transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={13} className="text-amber-600" />
            <span>Marketplace</span>
          </Link>

          {!isAgent && (
            <Link
              to="/customer"
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 hover:text-ink-900 transition-colors flex items-center gap-1.5"
            >
              <Calendar size={13} className="text-emerald-600" />
              <span>Customer Hub</span>
            </Link>
          )}

          {isAgent && (
            <>
              <Link
                to="/agent"
                className="px-2.5 py-1 rounded-lg hover:bg-slate-100 hover:text-ink-900 transition-colors flex items-center gap-1.5"
              >
                <Headphones size={13} className="text-indigo-600" />
                <span>Specialist Desk</span>
              </Link>
              <Link
                to="/agent/analytics"
                className="px-2.5 py-1 rounded-lg hover:bg-slate-100 hover:text-ink-900 transition-colors flex items-center gap-1.5"
              >
                <BarChart3 size={13} className="text-emerald-600" />
                <span>Telemetry</span>
              </Link>
            </>
          )}
        </div>

        {/* Instant Persona Switcher Pill (Judge Feature) */}
        {user?.isDemo && (
          <button
            onClick={handleSwitchPersona}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
            title="Toggle between Customer Portal and Specialist Command Center"
          >
            <RefreshCw size={11} className="text-amber-700" />
            <span className="hidden sm:inline">Switch to </span>
            <span>{isAgent ? 'Customer Portal 👤' : 'Specialist Desk 🎧'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Live Notification Bell with Dropdown Tray */}
        <NotificationBell />

        {/* User Badge */}
        <div className="text-right leading-tight hidden sm:block border-l border-ink-100 pl-3">
          <p className="text-xs text-ink-900 font-bold font-display">{user?.name}</p>
          <p className="text-[10px] text-ink-400 font-mono uppercase flex items-center justify-end gap-1">
            {isAgent ? <Headphones size={10} className="text-indigo-600" /> : <User size={10} className="text-teal-600" />}
            {user?.role}
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="p-1.5 text-ink-400 hover:text-rose-600 rounded-lg border border-ink-100 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;