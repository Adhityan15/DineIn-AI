import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Boxes, 
  CalendarDays, 
  Users, 
  UtensilsCrossed, 
  CreditCard,
  Bot,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Activity,
  Award,
  Layers,
  BarChart3,
  Clock,
  DollarSign,
  Building2,
  Star,
  Sliders,
  Terminal,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FluidGradientBackground from '../components/FluidGradientBackground';

// Luxury Hotel Brand Badges
const HotelBrands = [
  'RITZ-CARLTON',
  'FOUR SEASONS',
  'GRAND HYATT',
  'MARRIOTT INTERNATIONAL',
  'TAJ LUXURY HOTELS',
  'MICHELIN DINING GROUP'
];

// POS Integration Badges
const POSIntegrations = [
  'Oracle MICROS',
  'Toast POS',
  'Lightspeed',
  'Square Enterprise',
  'Clover',
  'Stripe Payments'
];

// Interactive Floor Plan Table Data
const InitialTables = [
  { id: 'T-01', name: 'VIP Booth 1', seats: 4, status: 'occupied', guest: 'Alexander Wright', elapsed: '42 mins', spend: '$380' },
  { id: 'T-02', name: 'Terrace Table 4', seats: 2, status: 'available', guest: 'Ready for Seating', elapsed: '0 mins', spend: '$0' },
  { id: 'T-03', name: 'Main Dining 12', seats: 6, status: 'reserved', guest: 'Claire Sterling (7:30 PM)', elapsed: 'Reserved', spend: '$0' },
  { id: 'T-04', name: 'Executive Suite 2', seats: 8, status: 'occupied', guest: 'Barclays Private Dinner', elapsed: '75 mins', spend: '$1,240' },
  { id: 'T-05', name: 'Window Table 8', seats: 2, status: 'available', guest: 'Ready for Seating', elapsed: '0 mins', spend: '$0' },
  { id: 'T-06', name: 'Chef Table VIP', seats: 10, status: 'occupied', guest: 'Chef Tasting Experience', elapsed: '90 mins', spend: '$2,850' }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('floor');
  const [selectedTable, setSelectedTable] = useState(InitialTables[0]);
  const [covers, setCovers] = useState(12000);
  const [copilotQuery, setCopilotQuery] = useState('What is our projected steak wastage for tonight\'s 250-cover dinner?');
  const [copilotResponse, setCopilotResponse] = useState(
    'Based on historical Friday telemetry and current 214 reservations, recommended ribeye prep is 42kg. Stock alert: Order +6kg by 4:00 PM to prevent 8:30 PM outage.'
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate estimated ROI savings based on slider
  const laborSavings = Math.round(covers * 0.95);
  const wasteSavings = Math.round(covers * 0.62);
  const totalSavings = laborSavings + wasteSavings;

  const handleCopilotPrompt = (prompt, answer) => {
    setCopilotQuery(prompt);
    setCopilotResponse(answer);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 relative font-sans overflow-x-hidden selection:bg-black selection:text-white">
      
      {/* Crystalline Light Atmosphere Background */}
      <FluidGradientBackground />

      {/* VIBRANT FLOATING NAVIGATION BAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className={`flex items-center justify-between p-4 sm:px-8 rounded-full transition-all duration-300 ${scrolled ? 'bg-white/95 border border-slate-300/90 backdrop-blur-3xl shadow-[0_16px_45px_rgba(15,23,42,0.12)]' : 'bg-white/80 border border-slate-200/90 backdrop-blur-xl shadow-md'}`}>
            
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center border border-slate-800 shadow-md group-hover:scale-105 transition-transform">
                <span className="font-black text-2xl tracking-wider text-white">D</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-xl text-slate-900 leading-none">
                  DineIn <span className="text-slate-600">AI</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Enterprise OS</span>
              </div>
            </Link>

            {/* Nav Links (Desktop) */}
            <div className="hidden lg:flex items-center gap-8 text-xs font-black tracking-wider uppercase text-slate-800">
              <a href="#showcase" className="hover:text-black transition-colors">Platform Engine</a>
              <a href="#features" className="hover:text-black transition-colors">Solutions</a>
              <a href="#demo" className="hover:text-black transition-colors">Live Matrix</a>
              <a href="#copilot" className="hover:text-black transition-colors">AI Copilot</a>
              <a href="#roi" className="hover:text-black transition-colors">ROI Calculator</a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-black text-white font-black text-xs rounded-full shadow-lg hover:bg-slate-800 hover:scale-105 transition-all cursor-pointer"
                >
                  Launch Workspace →
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2.5 text-xs font-black text-slate-900 hover:text-black transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-3 bg-black text-white font-black text-xs rounded-full shadow-lg hover:bg-slate-800 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight size={15} />
                  </button>
                </>
              )}
            </div>

          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-4xl mx-auto space-y-8">
            
            {/* Top Enterprise Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black tracking-widest uppercase shadow-lg"
            >
              <Award size={16} className="text-amber-400" />
              <span>TRUSTED BY 1,200+ LUXURY HOTELS & MICHELIN DINING GROUPS</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.06]"
            >
              The AI Floor & Kitchen Operating System for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
                Enterprise Hospitality
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-xl text-slate-700 max-w-3xl mx-auto font-bold leading-relaxed"
            >
              Unify reservations, real-time POS telemetry, predictive inventory cost management, 
              and geofenced workforce scheduling into an autonomous operational intelligence engine.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
            >
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4 bg-black text-white font-black text-sm rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.25)] hover:bg-slate-800 hover:scale-105 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Schedule Enterprise Walkthrough</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate('/reserve')}
                className="w-full sm:w-auto px-8 py-4 bg-white/90 hover:bg-white border border-slate-300 text-slate-900 font-black text-sm rounded-full backdrop-blur-xl transition-all hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
              >
                <CalendarDays size={18} className="text-slate-900" />
                <span>Test Booking Wizard</span>
              </button>

              <button
                onClick={() => navigate('/table/T-01/menu')}
                className="w-full sm:w-auto px-8 py-4 bg-white/90 hover:bg-white border border-slate-300 text-slate-900 font-black text-sm rounded-full backdrop-blur-xl transition-all hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
              >
                <UtensilsCrossed size={18} className="text-slate-900" />
                <span>Live Table Menu</span>
              </button>
            </motion.div>

            {/* Trust Markers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="pt-6 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-900 font-black uppercase tracking-widest"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-slate-900" />
                <span>JWT Enterprise Security</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-slate-900" />
                <span>WebSocket Sub-10ms Latency</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-slate-900" />
                <span>Multi-Property Certified</span>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* LUXURY BRAND MARQUEE */}
      <section className="py-8 border-y border-slate-200/90 bg-white/80 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-center text-slate-500 mb-6">
            POWERING WORLD-CLASS HOSPITALITY BRANDS & LUXURY HOTEL NETWORKS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-80">
            {HotelBrands.map((brand, idx) => (
              <span key={idx} className="text-xs sm:text-sm font-black tracking-widest text-slate-900 uppercase">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3D ENTERPRISE DASHBOARD SHOWCASE FRAME */}
      <section id="showcase" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-black tracking-widest uppercase">
              ENTERPRISE PLATFORM FRAMEWORK
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Real-Time Control Center for Operations
            </h2>
            <p className="text-sm sm:text-base font-bold text-slate-600">
              Interactive preview of the DineIn AI executive intelligence console.
            </p>
          </div>

          {/* Realistic SaaS Window Container */}
          <div className="p-4 sm:p-6 rounded-[36px] border border-slate-300/90 bg-white/95 backdrop-blur-3xl shadow-[0_30px_90px_-20px_rgba(15,23,42,0.18)] relative overflow-hidden">
            
            {/* Top SaaS Window Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 px-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-extrabold text-slate-600 font-mono">dinein-ai-enterprise.app</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-black uppercase text-slate-800">
                  Property #01 • Grand Ballroom & Dining
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM ACTIVE
                </span>
              </div>
            </div>

            {/* Showcase Navigation Tabs */}
            <div className="flex gap-2 p-2 mt-4 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('floor')}
                className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'floor' ? 'bg-black text-white shadow-md' : 'text-slate-700 hover:text-black'
                }`}
              >
                Floor Plan & Seating Matrix
              </button>
              <button
                onClick={() => setActiveTab('kitchen')}
                className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'kitchen' ? 'bg-black text-white shadow-md' : 'text-slate-700 hover:text-black'
                }`}
              >
                Kitchen Prep Telemetry (KDS)
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'inventory' ? 'bg-black text-white shadow-md' : 'text-slate-700 hover:text-black'
                }`}
              >
                AI Inventory Wastage Prediction
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'analytics' ? 'bg-black text-white shadow-md' : 'text-slate-700 hover:text-black'
                }`}
              >
                Executive Revenue Analytics
              </button>
            </div>

            {/* Tab 1: Floor Plan Matrix */}
            {activeTab === 'floor' && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-[28px] bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-black text-slate-900 uppercase">Live Table Allocations</span>
                    <span className="text-xs font-bold text-slate-600">66 Active Tables • 85% Capacity</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {InitialTables.map((table) => (
                      <div
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedTable.id === table.id 
                            ? 'bg-black text-white border-black shadow-lg scale-105' 
                            : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black">{table.id}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            table.status === 'occupied' ? 'bg-emerald-100 text-emerald-800' :
                            table.status === 'reserved' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {table.status}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold truncate">{table.name}</p>
                        <p className="text-[10px] opacity-80 mt-1 font-semibold">{table.seats} Seats • {table.spend}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Table Inspector */}
                <div className="p-6 rounded-[28px] bg-white border border-slate-200 shadow-lg space-y-4">
                  <span className="text-xs font-black text-slate-900 uppercase block border-b border-slate-200 pb-3">
                    Table Inspector • {selectedTable.id}
                  </span>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Table Name</span>
                      <span className="text-sm font-black text-slate-900">{selectedTable.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Guest / Party</span>
                      <span className="text-xs font-bold text-slate-800">{selectedTable.guest}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] font-bold text-slate-500 block">Seating Elapsed</span>
                        <span className="text-xs font-black text-slate-900">{selectedTable.elapsed}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] font-bold text-slate-500 block">Current Spend</span>
                        <span className="text-xs font-black text-emerald-600">{selectedTable.spend}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Kitchen Telemetry */}
            {activeTab === 'kitchen' && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-[24px] bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-black text-slate-900">Ticket #8401 • Table T-01</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">IN PREP</span>
                  </div>
                  <ul className="text-xs font-bold text-slate-800 space-y-1.5">
                    <li>• 2x Dry Aged Wagyu Ribeye (Medium Rare)</li>
                    <li>• 1x Truffle Risotto</li>
                    <li>• 2x Vintage Pinot Noir 2018</li>
                  </ul>
                  <div className="text-[10px] font-bold text-slate-500 pt-2 border-t flex justify-between">
                    <span>Timer: 8m 42s</span>
                    <span>Station: Grill 1</span>
                  </div>
                </div>

                <div className="p-5 rounded-[24px] bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-black text-slate-900">Ticket #8402 • Table T-04</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">READY</span>
                  </div>
                  <ul className="text-xs font-bold text-slate-800 space-y-1.5">
                    <li>• 4x Pan Seared Chilean Sea Bass</li>
                    <li>• 2x Roasted Asparagus</li>
                  </ul>
                  <div className="text-[10px] font-bold text-slate-500 pt-2 border-t flex justify-between">
                    <span>Timer: 14m 10s</span>
                    <span>Station: Saute 2</span>
                  </div>
                </div>

                <div className="p-5 rounded-[24px] bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-black text-slate-900">Ticket #8403 • Table T-06</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">QUEUED</span>
                  </div>
                  <ul className="text-xs font-bold text-slate-800 space-y-1.5">
                    <li>• 10x Chef Tasting Menu Course 4</li>
                  </ul>
                  <div className="text-[10px] font-bold text-slate-500 pt-2 border-t flex justify-between">
                    <span>Timer: 2m 05s</span>
                    <span>Station: Executive Pass</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Inventory Forecast */}
            {activeTab === 'inventory' && (
              <div className="mt-6 p-6 rounded-[28px] bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-xs font-black text-slate-900 uppercase block border-b pb-3">
                  AI Ingredient Stock Threshold & PO Auto-Triggering
                </span>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Dry Aged Wagyu Beef (Prime Grade)</h4>
                      <p className="text-[10px] font-semibold text-slate-500">Current Stock: 14.5 kg • Reorder Level: 20 kg</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                      PO #4920 Auto-Generated
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Black Summer Truffles (Perigord)</h4>
                      <p className="text-[10px] font-semibold text-slate-500">Current Stock: 850 g • Reorder Level: 500 g</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      Stock Optimal
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Executive Analytics */}
            {activeTab === 'analytics' && (
              <div className="mt-6 p-6 rounded-[28px] bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="text-xs font-black text-slate-900 uppercase">Daily Revenue & Cover Pace</span>
                  <span className="text-xs font-black text-emerald-600">+$14,850 Today (+18.4% vs Avg)</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Covers</span>
                    <span className="text-2xl font-black text-slate-900">418 Guests</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Spend / Cover</span>
                    <span className="text-2xl font-black text-slate-900">$138.50</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Table Turnover Time</span>
                    <span className="text-2xl font-black text-slate-900">54 mins</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* CORE SOLUTIONS SUITE */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-black tracking-widest uppercase">
              ENTERPRISE MODULES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Comprehensive Operations Architecture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-[28px] border border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
                <CalendarDays size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">AI Table Booking Engine</h3>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                Dynamic floor map optimization, automated SMS guest confirmations, and turn-time predictors for high-density dining rooms.
              </p>
            </div>

            <div className="p-8 rounded-[28px] border border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
                <Boxes size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Predictive Inventory Costing</h3>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                Real-time wastage calculation, ingredient batch tracking, and automatic purchase order placement with preferred suppliers.
              </p>
            </div>

            <div className="p-8 rounded-[28px] border border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Geofenced Staff Roster</h3>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                GPS validated shift clock-ins, labor law compliance tracking, and automated shift swapping for kitchen & front-of-house staff.
              </p>
            </div>

            <div className="p-8 rounded-[28px] border border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
                <CreditCard size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Omnichannel POS Sync</h3>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                Seamless real-time order dispatch to kitchen displays, table bill splitting, and enterprise PMS hotel room charge postings.
              </p>
            </div>

            <div className="p-8 rounded-[28px] border border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
                <UtensilsCrossed size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Kitchen Display (KDS)</h3>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                Real-time prep timer counters, station routing, and ticket priority queueing for chef staff.
              </p>
            </div>

            <div className="p-8 rounded-[28px] border border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
                <Bot size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Executive AI Copilot</h3>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                Ask complex operational questions in plain language and receive real-time business optimization recommendations.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* INTERACTIVE AI COPILOT CONSOLE */}
      <section id="copilot" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="p-8 sm:p-12 rounded-[36px] bg-slate-900 text-white shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Terminal size={24} className="text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Interactive AI Copilot Console
              </span>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-extrabold text-slate-400 block">Select Sample Operational Prompts:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCopilotPrompt(
                    'What is our projected steak wastage for tonight\'s 250-cover dinner?',
                    'Based on historical Friday telemetry and current 214 reservations, recommended ribeye prep is 42kg. Stock alert: Order +6kg by 4:00 PM to prevent 8:30 PM outage.'
                  )}
                  className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer border border-slate-700"
                >
                  🥩 Wagyu Stock & Wastage Forecast
                </button>
                <button
                  onClick={() => handleCopilotPrompt(
                    'Check staff clock-in compliance for tonight\'s dinner shift.',
                    '18 of 20 scheduled staff clocked in via GPS geofence. 2 servers currently 10 mins late (notifications sent).'
                  )}
                  className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer border border-slate-700"
                >
                  👥 Staff GPS Geofence Compliance
                </button>
                <button
                  onClick={() => handleCopilotPrompt(
                    'Recommend optimal 8:00 PM VIP table allocation for Party of 6.',
                    'Table VIP-02 on Main Terrace is predicted to open at 7:52 PM (88% confidence based on dessert order billing).'
                  )}
                  className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer border border-slate-700"
                >
                  🍷 VIP Table Allocation Optimization
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="text-emerald-400 font-bold">&gt;</span> {copilotQuery}
              </div>
              <div className="text-xs font-bold text-emerald-300 leading-relaxed pl-4 border-l-2 border-emerald-500">
                {copilotResponse}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE ROI CALCULATOR */}
      <section id="roi" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="p-8 sm:p-14 rounded-[36px] border border-slate-200 bg-white/90 backdrop-blur-3xl shadow-xl space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-black tracking-widest uppercase">
                ENTERPRISE FINANCIAL IMPACT
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900">
                Estimate Your Monthly ROI Savings
              </h2>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span>Monthly Guest Covers Served:</span>
                  <span className="text-lg font-black text-black">{covers.toLocaleString()} Covers</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={covers}
                  onChange={(e) => setCovers(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Labor Efficiency</span>
                  <span className="text-xl font-black text-slate-900">${laborSavings.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Wastage Reduction</span>
                  <span className="text-xl font-black text-slate-900">${wasteSavings.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-2xl bg-black text-white shadow-lg">
                  <span className="text-[10px] font-bold text-slate-300 uppercase block">Total Monthly Savings</span>
                  <span className="text-2xl font-black text-white">${totalSavings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* POS INTEGRATION MATRIX */}
      <section className="py-16 border-t border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            NATIVE ENTERPRISE HARDWARE & POS INTEGRATIONS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {POSIntegrations.map((pos, idx) => (
              <span key={idx} className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs font-black text-slate-900">
                {pos}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-200 relative z-10 bg-white backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-800 font-bold">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm">
              D
            </div>
            <span className="font-extrabold text-slate-900">DineIn AI Enterprise Operating System</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-black transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-black transition-colors">Register</Link>
            <Link to="/reserve" className="hover:text-black transition-colors">Public Reservations</Link>
            <a href="mailto:support@dinein.com" className="hover:text-black transition-colors">Support</a>
          </div>

          <div className="text-slate-600 font-semibold">
            © {new Date().getFullYear()} DineIn AI. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
