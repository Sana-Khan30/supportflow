import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles, MessageSquare, Headphones, ShieldCheck,
  Calendar, CheckCircle2, ArrowRight, Star, RefreshCw,
  Flower2, Droplets, Zap, Hammer, Sparkle, Paintbrush, Wind
} from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import ServiceMarketplace from '../components/ServiceMarketplace';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const [searchParams] = useSearchParams();
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoCustomer = async () => {
    try {
      await demoLogin('customer');
      navigate('/customer');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDemoAgent = async () => {
    try {
      await demoLogin('agent');
      navigate('/agent');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-ink-900">
      {/* Top Header Dark Surface */}
      <div className="bg-slate-950 text-white border-b border-slate-800">
        <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Logo dark />
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              AI Support & Service Ops
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to={user.role === 'agent' ? '/agent' : '/customer'}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Open Workspace →
                </Button>
              </Link>
            ) : (
              <>
                <button
                  onClick={handleDemoCustomer}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 cursor-pointer"
                >
                  <span>Demo Customer</span>
                </button>

                <button
                  onClick={handleDemoAgent}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer"
                >
                  <Headphones size={12} />
                  <span>Demo Specialist Desk</span>
                </button>

                <Link to="/login" className="text-xs font-medium text-slate-300 hover:text-white px-2">
                  Log in
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="light">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <header className="max-w-6xl mx-auto px-6 pt-10 pb-16 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-amber-300 font-mono shadow-xs">
            <Sparkles size={13} />
            <span>AI Complaint Triage • Guaranteed Service Bookings • Human-Supervised Resolution</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Book local verified specialists with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              AI-guaranteed dispute resolution.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
            Schedule appointments for gardening, plumbing, electrical, carpentry, AC repair and more. If anything goes wrong, our real-time multi-dimensional AI triage automatically classifies, routes, and supervises fast resolution.
          </p>

          {/* 1-Click Persona CTA Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDemoCustomer}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <span>Explore as Customer 👤</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={handleDemoAgent}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs font-mono border border-slate-700 shadow-lg transition-all cursor-pointer"
            >
              <Headphones size={14} />
              <span>Launch 3-Pane Specialist Desk 🎧</span>
            </button>
          </div>
        </header>
      </div>

      {/* Main Content Area: Interactive Live Marketplace */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        <ServiceMarketplace initialCategory={searchParams.get('category') || 'All'} />

        {/* Feature Highlights Banner */}
        <section className="bg-white border border-ink-100 rounded-2xl p-6 sm:p-8 shadow-2xs grid sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-display font-bold text-ink-900 text-sm">
              Verified Craftsmen & Fixed Rates
            </h3>
            <p className="text-xs text-ink-500 font-sans leading-relaxed">
              Every provider is vetted for skill accreditation, customer ratings, and transparent hourly pricing with zero hidden fees.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <h3 className="font-display font-bold text-ink-900 text-sm">
              AI Multi-Dimensional Triage
            </h3>
            <p className="text-xs text-ink-500 font-sans leading-relaxed">
              Complaint tickets analyze sentiment, intent, SLA risk, and duplicate incidents instantly on submission.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Headphones size={18} />
            </div>
            <h3 className="font-display font-bold text-ink-900 text-sm">
              Human-Supervised Resolution Desk
            </h3>
            <p className="text-xs text-ink-500 font-sans leading-relaxed">
              Specialists manage queues with dynamic countdown timers, grounded knowledge runbooks, and auditable history.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-8 px-6 text-xs text-center font-mono">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <Logo dark size="sm" />
          <p>© 2026 SupportFlow • Intelligent Service Marketplace & AI Resolution Command Center</p>
          <div className="flex items-center gap-4">
            <button onClick={handleDemoCustomer} className="hover:text-white cursor-pointer">Demo Customer</button>
            <button onClick={handleDemoAgent} className="hover:text-white cursor-pointer">Demo Specialist</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;