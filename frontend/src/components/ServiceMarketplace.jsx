import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, ShieldCheck, Clock, Sparkles,
  Calendar, Check, ChevronRight, ArrowUpRight, Wrench,
  Flame, Flower2, Droplets, Zap, Hammer, Sparkle, Paintbrush, Wind
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookingModal from './BookingModal';
import Button from './ui/Button';

export const CATEGORIES = [
  { id: 'All', label: 'All Services', icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Gardening', label: 'Gardening', icon: Flower2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'Plumbing', label: 'Plumbing', icon: Droplets, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { id: 'Electrical', label: 'Electrical', icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'Carpentry', label: 'Carpentry', icon: Hammer, color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { id: 'Cleaning', label: 'Cleaning', icon: Sparkle, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  { id: 'Painting', label: 'Painting', icon: Paintbrush, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'AC Repair', label: 'AC Repair', icon: Wind, color: 'text-blue-700 bg-blue-50 border-blue-200' },
];

const CATEGORY_DETAILS = {
  Gardening: {
    tagline: 'Expert horticulturalists, lawn restoration, tree trimming & automated irrigation',
    highlight: '14-Day Growth & Health Guarantee • Certified Master Gardeners'
  },
  Plumbing: {
    tagline: 'Rapid leak detection, pipe welding, sewer drainage & water heaters',
    highlight: '15-Min Fast Dispatch • Thermal Camera Leak Diagnosis'
  },
  Electrical: {
    tagline: 'Circuit repairs, distribution boards, solar inverters & backup wiring',
    highlight: 'Licensed 1000V High-Voltage Safety Inspected'
  },
  Carpentry: {
    tagline: 'Custom solid wood furniture, modular cabinetry & door frame alignments',
    highlight: 'Artisan Wood Crafting & Precision Joinery'
  },
  Cleaning: {
    tagline: 'Hospital-grade steam sanitation, deep carpet extraction & post-renovation cleaning',
    highlight: 'Eco-Friendly Disinfection & Jet Shampooing'
  },
  Painting: {
    tagline: 'Interior premium emulsions, exterior waterproofing & textured accent finishes',
    highlight: 'Zero-Damp Weatherproof Sealant Protection'
  },
  'AC Repair': {
    tagline: 'Inverter PCB board diagnostics, gas charging & high-pressure chemical wash',
    highlight: 'Delta 12°C Sub-Cooling Performance Guarantee'
  }
};

const ServiceMarketplace = ({ initialCategory = 'All', onSelectBooking = null, isEmbedded = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');

  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Read category from URL param or props
  const activeCategory = searchParams.get('category') || initialCategory || 'All';

  const handleCategoryChange = (catId) => {
    if (catId === 'All') {
      searchParams.delete('category');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ category: catId }, { replace: true });
    }
  };

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory && activeCategory !== 'All') params.category = activeCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedLocation && selectedLocation !== 'All') params.location = selectedLocation;

      const res = await api.get('/bookings/providers', { params });
      setProviders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [activeCategory, searchQuery, selectedLocation]);

  const handleBookClick = async (provider) => {
    if (!user) {
      // Auto-login as demo customer for swift hackathon experience
      try {
        toast('Logging you in as Demo Customer...', { icon: '🔑' });
        await demoLogin('customer');
      } catch (e) {
        console.error(e);
      }
    }
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = (booking) => {
    if (onSelectBooking) {
      onSelectBooking(booking);
    } else {
      navigate('/customer');
    }
  };

  const catMeta = CATEGORY_DETAILS[activeCategory];

  return (
    <div className="space-y-6">
      {/* Category Pills Header (Matching Reference App UX) */}
      <div className="bg-white border border-ink-100 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink-900 flex items-center gap-2">
              <span>Verified Service Marketplace</span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Catalog
              </span>
            </h2>
            <p className="text-xs text-ink-400 font-sans mt-0.5">
              Browse top-rated craftsmen, schedule guaranteed visits, and track service quality with AI dispute triage.
            </p>
          </div>
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = (activeCategory === cat.id) || (cat.id === 'All' && !activeCategory);
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs scale-[1.02]'
                    : 'bg-slate-50 text-ink-700 border-ink-200 hover:bg-slate-100 hover:text-ink-900'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-300' : 'text-ink-500'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Location Bar */}
        <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
          <div className="relative sm:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeCategory === 'All' ? 'any service or specialist' : activeCategory + ' specialists'}...`}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-ink-200 rounded-xl text-xs focus:ring-2 focus:ring-ink-900 focus:bg-white transition-all shadow-2xs"
            />
            <Search size={14} className="absolute left-3 top-3 text-ink-400" />
          </div>

          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-ink-200 rounded-xl text-xs focus:ring-2 focus:ring-ink-900 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Locations</option>
              <option value="Gulberg">Gulberg & Model Town</option>
              <option value="DHA">DHA Lahore</option>
              <option value="Johar Town">Johar Town</option>
              <option value="Cantt">Cantt & Saddar</option>
              <option value="Bahria Town">Bahria Town</option>
            </select>
            <MapPin size={14} className="absolute left-2.5 top-3 text-ink-400 pointer-events-none" />
          </div>
        </div>

        {/* Dynamic Category Banner if a category is picked */}
        {catMeta && (
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-amber-300 font-display flex items-center gap-1.5">
                <Sparkles size={13} /> {catMeta.highlight}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 font-sans">
                {catMeta.tagline}
              </p>
            </div>
            <span className="font-mono text-[10px] bg-white/10 px-2.5 py-1 rounded-md border border-white/20">
              {providers.length} Verified Providers Available
            </span>
          </div>
        )}
      </div>

      {/* Providers Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-ink-100 rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-2/3" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-9 bg-slate-200 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-12 text-center space-y-3">
          <Wrench size={32} className="mx-auto text-ink-300" />
          <h3 className="font-display font-semibold text-ink-800 text-base">
            No specialists found in this category
          </h3>
          <p className="text-xs text-ink-400 max-w-sm mx-auto">
            Try choosing a different category or clear your search terms to view all verified service specialists.
          </p>
          <Button size="sm" onClick={() => handleCategoryChange('All')}>
            View All Services
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
            <div
              key={p._id}
              className="group relative bg-white border border-ink-100 hover:border-ink-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Category Badge & Rating */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-ink-800 border border-slate-200">
                    {p.category || 'Specialist'}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    <Star size={11} className="fill-amber-500 text-amber-500" />
                    <span>{p.rating || 4.9}</span>
                    <span className="text-[10px] text-amber-900/60 font-normal">({p.reviewCount || 15})</span>
                  </div>
                </div>

                {/* Business & Name */}
                <h3 className="font-display font-bold text-sm text-ink-900 group-hover:text-amber-900 transition-colors">
                  {p.businessName || `${p.name} Services`}
                </h3>
                <p className="text-xs text-ink-500 font-sans flex items-center gap-1 mt-0.5">
                  <span>{p.name}</span>
                  <ShieldCheck size={12} className="text-emerald-600" title="Verified Specialist" />
                </p>

                {/* Bio */}
                <p className="text-xs text-ink-600 font-sans mt-2.5 line-clamp-2 leading-relaxed">
                  {p.bio || 'Experienced certified craftsman delivering premium on-site service.'}
                </p>

                {/* Specialties Tags */}
                {p.specialties && p.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {p.specialties.slice(0, 3).map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 bg-slate-50 text-ink-600 rounded border border-slate-200/70"
                      >
                        {spec}
                      </span>
                    ))}
                    {p.specialties.length > 3 && (
                      <span className="text-[10px] font-mono text-ink-400 self-center">
                        +{p.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer: Price & Book Button */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono text-ink-400">Standard Rate</p>
                  <p className="font-display font-bold text-sm text-ink-900">
                    ₨ {p.hourlyRate || 1500} <span className="text-[10px] font-mono font-normal text-ink-500">/hr</span>
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleBookClick(p)}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white shadow-2xs cursor-pointer"
                >
                  <Calendar size={13} />
                  <span>Reserve</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Drawer Modal */}
      <BookingModal
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProvider(null);
        }}
        onBookingCreated={handleBookingSuccess}
      />
    </div>
  );
};

export default ServiceMarketplace;
