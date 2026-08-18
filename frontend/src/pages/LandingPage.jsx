import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Terminal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FluidGradientBackground from '../components/FluidGradientBackground';

// CEO Specification Color Palette Pill Badges
const ColorPalettePills = [
  { hex: '#49DC7A', label: 'Electric Blue', colorClass: 'bg-[#49DC7A]' },
  { hex: '#A3E635', label: 'Neon Green', colorClass: 'bg-[#A3E635]' },
  { hex: '#22F2EF', label: 'Ice Blue', colorClass: 'bg-[#22F2EF]' },
  { hex: '#040A0A', label: 'Obsidian Dark', colorClass: 'bg-[#040A0A]' },
  { hex: '#FFFFFF', label: 'Crisp White', colorClass: 'bg-[#FFFFFF]' }
];

const FeatureCard = ({ icon: Icon, title, description, badge, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6, ease: 'easeOut' }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="p-8 rounded-[28px] border border-white/15 bg-[#040A0A]/80 backdrop-blur-2xl relative overflow-hidden group transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:border-white/35"
  >
    {/* CEO Specular Top Rim Light */}
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#49DC7A] to-[#A3E635] opacity-80 group-hover:opacity-100 transition-all duration-300" />
    
    <div className="flex items-center justify-between mb-6">
      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
        <Icon size={26} className="text-[#49DC7A]" />
      </div>
      {badge && (
        <span className="px-3.5 py-1 text-xs font-black uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-full shadow-sm">
          {badge}
        </span>
      )}
    </div>

    <h3 className="text-xl font-black text-white tracking-tight mb-3 group-hover:text-[#22F2EF] transition-colors">
      {title}
    </h3>
    <p className="text-sm text-slate-200 font-semibold leading-relaxed">
      {description}
    </p>

    <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-xs font-black text-white group-hover:text-[#49DC7A] transition-colors gap-2">
      <span>Explore operational specs</span>
      <ChevronRight size={16} className="group-hover:translate-x-1.5 transition-transform text-[#49DC7A]" />
    </div>
  </motion.div>
);

const StatBox = ({ value, label, subtext }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="p-7 rounded-[26px] text-center border border-white/15 bg-[#040A0A]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
  >
    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
      {value}
    </div>
    <div className="text-xs font-black uppercase tracking-widest text-slate-200 mb-1">
      {label}
    </div>
    {subtext && (
      <div className="text-xs font-bold text-[#A3E635]">
        {subtext}
      </div>
    )}
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [covers, setCovers] = useState(15000);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const laborSavings = Math.round(covers * 0.95);
  const wasteSavings = Math.round(covers * 0.62);
  const totalSavings = laborSavings + wasteSavings;

  return (
    <div className="dark min-h-screen bg-[#040A0A] text-white relative font-sans overflow-x-hidden selection:bg-[#A3E635] selection:text-black">
      
      {/* CEO Running Gradient Mesh Backdrop (Blue & Green Morphing Orbs) */}
      <FluidGradientBackground />

      {/* FLOATING GLASS NAVIGATION BAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className={`flex items-center justify-between p-4 sm:px-8 rounded-full transition-all duration-300 ${scrolled ? 'bg-[#040A0A]/90 border border-white/20 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]' : 'bg-white/5 border border-white/15 backdrop-blur-xl'}`}>
            
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform">
                <span className="font-black text-2xl tracking-wider">D</span>
              </div>
              <span className="font-black tracking-tight text-2xl text-white">
                DineIn <span className="text-[#49DC7A]">AI</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden lg:flex items-center gap-8 text-xs font-black tracking-wider uppercase text-slate-200">
              <a href="#palette" className="hover:text-[#A3E635] transition-colors">CEO Template Specs</a>
              <a href="#features" className="hover:text-[#49DC7A] transition-colors">AI Modules</a>
              <a href="#metrics" className="hover:text-[#22F2EF] transition-colors">Performance</a>
              <a href="#roi" className="hover:text-white transition-colors">ROI Calculator</a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-white !text-black font-black text-xs rounded-full shadow-[0_0_25px_rgba(255,255,255,0.7)] hover:bg-slate-200 hover:scale-105 transition-all cursor-pointer"
                  style={{ color: '#000000' }}
                >
                  <span className="!text-black font-black" style={{ color: '#000000' }}>Launch Workspace →</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2.5 text-xs font-black !text-white hover:text-[#A3E635] transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-3 bg-white !text-black font-black text-xs rounded-full shadow-[0_0_25px_rgba(255,255,255,0.7)] hover:bg-slate-200 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                    style={{ color: '#000000' }}
                  >
                    <span className="!text-black font-black" style={{ color: '#000000' }}>Get Started</span>
                    <ArrowRight size={15} className="!text-black" style={{ color: '#000000' }} />
                  </button>
                </>
              )}
            </div>

          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-24 sm:pt-48 sm:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-4xl mx-auto space-y-8">
            
            {/* Top CEO Template Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl text-white text-xs font-black tracking-widest uppercase shadow-lg"
            >
              <Sparkles size={16} className="animate-pulse text-[#A3E635]" />
              <span>OUTFIT TYPOGRAPHY & AROUNDA COLOR PALETTE SYSTEM</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
            >
              Next-Gen AI Operating System for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-white via-[#49DC7A] to-[#A3E635] bg-clip-text text-transparent">
                Modern Hospitality Operations
              </span>
            </motion.h1>

            {/* Vibrant Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-xl text-slate-200 max-w-3xl mx-auto font-semibold leading-relaxed drop-shadow"
            >
              Unify reservations, predictive inventory costing, geofenced workforce rosters, 
              and real-time POS telemetry into an autonomous glass intelligence dashboard.
            </motion.p>

            {/* Hero Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4 bg-white !text-black font-black text-sm rounded-full shadow-[0_0_35px_rgba(255,255,255,0.7)] hover:bg-slate-200 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{ color: '#000000' }}
              >
                <span className="!text-black font-black" style={{ color: '#000000' }}>Launch Enterprise Workspace</span>
                <ArrowRight size={18} className="!text-black" style={{ color: '#000000' }} />
              </button>

              <button
                onClick={() => navigate('/reserve')}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-sm rounded-full backdrop-blur-xl transition-all hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
              >
                <CalendarDays size={18} className="text-[#49DC7A]" />
                <span>Test Booking Wizard</span>
              </button>

              <button
                onClick={() => navigate('/table/T-01/menu')}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-sm rounded-full backdrop-blur-xl transition-all hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
              >
                <UtensilsCrossed size={18} className="text-[#A3E635]" />
                <span>Live Table Menu</span>
              </button>
            </motion.div>

            {/* Trust Markers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-300 font-black uppercase tracking-widest"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#49DC7A]" />
                <span>JWT Enterprise Secure</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#A3E635]" />
                <span>Real-Time WebSocket Sync</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#22F2EF]" />
                <span>Multi-Property Certified</span>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* CEO COLOR PALETTE & TYPOGRAPHY SPEC SHOWCASE SECTION */}
      <section id="palette" className="py-16 border-y border-white/15 bg-white/5 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-center text-slate-300 mb-6">
            EXTRACTED CEO SPECIFICATION: OUTFIT FONT & AROUNDA COLOR PALETTE
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {ColorPalettePills.map((pill, idx) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl shadow-lg">
                <div className={`w-5 h-5 rounded-full border border-white/40 ${pill.colorClass}`} />
                <span className="text-xs font-mono font-black text-white">{pill.hex}</span>
                <span className="text-xs font-bold text-slate-300">({pill.label})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SHOWCASE SECTION */}
      <section id="metrics" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatBox value="99.9%" label="System Availability" subtext="Redundant Failover Sync" />
            <StatBox value="3.4x" label="Peak Throughput" subtext="Automated Table Allocations" />
            <StatBox value="45%" label="Waste Reduction" subtext="Predictive Inventory Costing" />
            <StatBox value="< 10ms" label="Telemetry Latency" subtext="Instant Ticket Sync" />
          </div>
        </div>
      </section>

      {/* CORE SOLUTIONS SUITE */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#A3E635] text-xs font-black tracking-widest uppercase">
              OPERATIONAL INTELLIGENCE SUITE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Engineered for High-Performance Hospitality
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <FeatureCard 
              icon={CalendarDays}
              title="AI Reservation Engine"
              description="Live table layout matrices mapping dynamic guest seatings, floor plan designs, and automated instant confirmations."
              badge="RESERVATIONS"
              delay={0.1}
            />

            <FeatureCard 
              icon={Boxes}
              title="Predictive Inventory Costing"
              description="Tracks low-stock threshold parameters, batch wastage cost analysis, and automated purchase order triggers."
              badge="INVENTORY"
              delay={0.2}
            />

            <FeatureCard 
              icon={Users}
              title="Geofenced Workforce Roster"
              description="Compliant shift scheduling, GPS geofencing clock-in validations, and employee burnout limit safeguards."
              badge="ROSTER"
              delay={0.3}
            />

            <FeatureCard 
              icon={CreditCard}
              title="Omnichannel POS Sync"
              description="Instant order ticket dispatching, table status tracking, and multi-payment settlement processing."
              badge="POS"
              delay={0.4}
            />

            <FeatureCard 
              icon={UtensilsCrossed}
              title="Kitchen Display System (KDS)"
              description="Real-time prep timer counters, station routing, and ticket priority queueing for chef staff."
              badge="KITCHEN"
              delay={0.5}
            />

            <FeatureCard 
              icon={Bot}
              title="Executive AI Copilot"
              description="Ask complex operational questions in plain language and receive real-time business optimization recommendations."
              badge="AI COPILOT"
              delay={0.6}
            />

          </div>

        </div>
      </section>

      {/* INTERACTIVE ROI CALCULATOR */}
      <section id="roi" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="p-8 sm:p-14 rounded-[36px] border border-white/20 bg-[#040A0A]/90 backdrop-blur-3xl shadow-2xl space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-4 py-1.5 rounded-full bg-white/10 text-[#49DC7A] text-xs font-black tracking-widest uppercase border border-white/20">
                FINANCIAL IMPACT CALCULATOR
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white">
                Estimate Monthly Enterprise Savings
              </h2>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span>Monthly Guest Covers Served:</span>
                  <span className="text-lg font-black text-[#A3E635]">{covers.toLocaleString()} Covers</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={covers}
                  onChange={(e) => setCovers(Number(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#A3E635]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/15">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Labor Efficiency</span>
                  <span className="text-xl font-black text-white">${laborSavings.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/15">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Wastage Reduction</span>
                  <span className="text-xl font-black text-white">${wasteSavings.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#49DC7A] to-[#A3E635] text-black shadow-lg">
                  <span className="text-[10px] font-black uppercase block">Total Savings</span>
                  <span className="text-2xl font-black">${totalSavings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/15 relative z-10 bg-[#040A0A] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-300 font-bold">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm">
              D
            </div>
            <span className="font-extrabold text-white">DineIn AI Operating System</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[#49DC7A] transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-[#A3E635] transition-colors">Register</Link>
            <Link to="/reserve" className="hover:text-[#22F2EF] transition-colors">Public Reservations</Link>
            <a href="mailto:support@dinein.com" className="hover:text-white transition-colors">Support</a>
          </div>

          <div className="text-slate-400 font-semibold">
            © {new Date().getFullYear()} DineIn AI. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
