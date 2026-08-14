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
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FluidGradientBackground from '../components/FluidGradientBackground';

const FeatureCard = ({ icon: Icon, title, description, badge, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6, ease: 'easeOut' }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="p-8 rounded-[28px] border border-slate-200/90 bg-white/85 backdrop-blur-2xl relative overflow-hidden group transition-all duration-300 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.08)] hover:border-black/40 hover:shadow-[0_22px_50px_-10px_rgba(15,23,42,0.15)]"
  >
    {/* Top Specular Rim Highlight */}
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent group-hover:via-black transition-all duration-300" />
    
    <div className="flex items-center justify-between mb-6">
      <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
        <Icon size={26} className="text-white" />
      </div>
      {badge && (
        <span className="px-3.5 py-1 text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-900 border border-slate-300 rounded-full shadow-sm">
          {badge}
        </span>
      )}
    </div>

    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3 group-hover:text-black transition-colors">
      {title}
    </h3>
    <p className="text-sm text-slate-700 font-semibold leading-relaxed">
      {description}
    </p>

    <div className="mt-6 pt-4 border-t border-slate-200 flex items-center text-xs font-black text-slate-900 group-hover:text-black transition-colors gap-2">
      <span>Explore operational specs</span>
      <ChevronRight size={16} className="group-hover:translate-x-1.5 transition-transform text-slate-900" />
    </div>
  </motion.div>
);

const StatBox = ({ value, label, subtext }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="p-7 rounded-[26px] text-center border border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-[0_16px_40px_-10px_rgba(15,23,42,0.08)]"
  >
    <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
      {value}
    </div>
    <div className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1">
      {label}
    </div>
    {subtext && (
      <div className="text-xs font-bold text-slate-600">
        {subtext}
      </div>
    )}
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 relative font-sans overflow-x-hidden selection:bg-black selection:text-white">
      
      {/* Dynamic Animated Backdrop Orbs */}
      <FluidGradientBackground />

      {/* VIBRANT NAVIGATION BAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className={`flex items-center justify-between p-4 sm:px-8 rounded-full transition-all duration-300 ${scrolled ? 'bg-white/90 border border-slate-300/80 backdrop-blur-3xl shadow-[0_12px_40px_rgba(15,23,42,0.08)]' : 'bg-white/70 border border-slate-200/80 backdrop-blur-xl'}`}>
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center border border-slate-800 shadow-md group-hover:scale-105 transition-transform">
                <span className="font-black text-2xl tracking-wider text-white">D</span>
              </div>
              <span className="font-black tracking-tight text-2xl text-slate-900">
                DineIn <span className="text-slate-600">AI</span>
              </span>
            </Link>

            {/* Nav Links (Desktop) */}
            <div className="hidden md:flex items-center gap-8 text-xs font-black tracking-wider uppercase text-slate-800">
              <a href="#features" className="hover:text-black transition-colors">Features</a>
              <a href="#intelligence" className="hover:text-black transition-colors">AI Engine</a>
              <a href="#metrics" className="hover:text-black transition-colors">Performance</a>
              <a href="#preview" className="hover:text-black transition-colors">Live Operations</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-black text-white font-black text-xs rounded-full shadow-lg hover:bg-slate-800 hover:scale-105 transition-all cursor-pointer"
                >
                  Go to Dashboard →
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
      <section className="relative pt-40 pb-24 sm:pt-48 sm:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-4xl mx-auto space-y-8">
            
            {/* Top Glowing Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black tracking-widest uppercase shadow-md"
            >
              <Sparkles size={16} className="animate-pulse text-white" />
              <span>AUTONOMOUS RESTAURANT OPERATIONS INTELLIGENCE</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.08]"
            >
              Next-Gen AI Operating System for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
                Modern Hospitality Operations
              </span>
            </motion.h1>

            {/* Vibrant Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-xl text-slate-700 max-w-3xl mx-auto font-bold leading-relaxed"
            >
              Unify reservations, predictive inventory costing, geofenced workforce rosters, 
              and real-time POS telemetry into a crystal-clear glass intelligence dashboard.
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
                className="w-full sm:w-auto px-8 py-4 bg-black text-white font-black text-sm rounded-full shadow-[0_16px_36px_rgba(0,0,0,0.2)] hover:bg-slate-800 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Enterprise Workspace</span>
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
              className="pt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-900 font-black uppercase tracking-widest"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-slate-900" />
                <span>JWT Enterprise Secure</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-slate-900" />
                <span>Real-Time WebSocket Sync</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-slate-900" />
                <span>Multi-Branch Certified</span>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* STATS SHOWCASE SECTION */}
      <section id="metrics" className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatBox value="99.9%" label="System Availability" subtext="Redundant WebSocket Failover" />
            <StatBox value="3.4x" label="Peak Throughput" subtext="Automated Table Allocations" />
            <StatBox value="45%" label="Waste Reduction" subtext="Predictive Inventory Costing" />
            <StatBox value="< 10ms" label="Telemetry Latency" subtext="Instant Kitchen Ticket Sync" />
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">
              OPERATIONAL INTELLIGENCE SUITE
            </h2>
            <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Engineered for High-Performance Hospitality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <FeatureCard 
              icon={CalendarDays}
              title="AI Reservation Wizard"
              description="Live table layout matrices mapping dynamic guest seatings, floor plan designs, and automated instant confirmations."
              badge="RESERVATIONS"
              delay={0.1}
            />

            <FeatureCard 
              icon={Boxes}
              title="Predictive Inventory Engine"
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

      {/* LIVE INTERACTIVE PREVIEW SECTION */}
      <section id="preview" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="p-8 sm:p-14 rounded-[36px] border border-slate-200/90 bg-white/90 backdrop-blur-3xl relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-black via-slate-700 to-black" />
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="space-y-6 max-w-xl">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-black tracking-widest uppercase shadow-md">
                  <Activity size={16} className="text-white animate-pulse" />
                  <span>REAL-TIME LIVE TELEMETRY</span>
                </div>
                <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  Experience Unified Operations In Real Time
                </h3>
                <p className="text-base text-slate-700 font-semibold leading-relaxed">
                  Monitor table turnover, stock velocity, and staffing compliance in real-time. 
                  DineIn AI turns complex hospitality telemetry into clear, actionable intelligence.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-4 bg-black text-white font-black text-xs rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:bg-slate-800 hover:scale-105 transition-all cursor-pointer"
                  >
                    Enter Workspace →
                  </button>
                </div>
              </div>

              {/* Mock Dashboard Preview Window */}
              <div className="w-full lg:w-1/2 p-7 rounded-[28px] border border-slate-300/80 bg-slate-100/90 backdrop-blur-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-300 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Live System Feed</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900">SYNC: 100% OK</span>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Active Reservations</span>
                    <span className="text-xs font-black text-slate-900">696 Guests</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Available Tables</span>
                    <span className="text-xs font-black text-emerald-600">66 Tables</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Low-Stock Ingredients</span>
                    <span className="text-xs font-black text-amber-600">20 Alerts</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-200 relative z-10 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-800 font-bold">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm">
              D
            </div>
            <span className="font-extrabold text-slate-900">DineIn AI Operating System</span>
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
