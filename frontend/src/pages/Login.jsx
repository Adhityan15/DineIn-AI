import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ShieldCheck, 
  Boxes,
  CalendarDays,
  Users,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Switch
} from '../components/DesignSystem';
import FluidGradientBackground from '../components/FluidGradientBackground';

const LeftPanelFeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
    className="bg-white/10 border border-white/20 p-4 rounded-2xl flex gap-3.5 hover:bg-white/15 hover:border-white/30 transition-all select-none"
  >
    <span className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
      <Icon size={18} />
    </span>
    <div>
      <h4 className="text-white text-xs font-bold">{title}</h4>
      <p className="text-xs text-slate-200 mt-1 leading-normal font-semibold">{desc}</p>
    </div>
  </motion.div>
);

const Login = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const taglines = [
    'Restaurant Intelligence',
    'Predictive Analytics',
    'Smart Reservations',
    'Inventory AI',
    'Business Intelligence',
    'Customer Insights',
    'AI Workforce'
  ];
  const [tagIndex, setTagIndex] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('remembered_email');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let timer;
    const currentFullText = taglines[tagIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setTypingText(currentFullText.substring(0, typingText.length - 1));
      }, 50);
    } else {
      timer = setTimeout(() => {
        setTypingText(currentFullText.substring(0, typingText.length + 1));
      }, 100);
    }

    if (!isDeleting && typingText === currentFullText) {
      timer = setTimeout(() => setIsDeleting(true), 1500);
    } else if (isDeleting && typingText === '') {
      setIsDeleting(false);
      setTagIndex((prev) => (prev + 1) % taglines.length);
    }

    return () => clearTimeout(timer);
  }, [typingText, isDeleting, tagIndex]);

  const validateForm = () => {
    const tempErrors = {};
    if (!email.trim()) {
      tempErrors.email = 'Email or Username is required';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      await login(email, password);
      addToast('Sign-in successful. Welcome to DineIn AI!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login submit error:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Invalid credentials';
      setErrors({ form: errMsg });
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-black flex relative overflow-hidden font-sans text-slate-100 selection:bg-sky-400 selection:text-black">
      
      {/* 4K Motion Glass Backdrop */}
      <FluidGradientBackground />

      {/* LEFT PANEL: BRANDING & SYSTEM INSIGHTS */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10 border-r border-white/15 bg-[#0B1120]/80 backdrop-blur-2xl">
        
        {/* Brand Header */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-cyan-400 text-black flex items-center justify-center border border-white/50 shadow-[0_0_24px_rgba(56,189,248,0.5)]">
              <span className="font-black text-2xl tracking-wider text-black">D</span>
            </div>
            <span className="font-black tracking-tight text-2xl text-white drop-shadow-md">
              DineIn <span className="text-sky-400">AI</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-black tracking-widest uppercase">
            <Sparkles size={15} className="animate-pulse text-sky-300" />
            <span>OPERATIONAL ENTERPRISE PORTAL</span>
          </div>
        </div>

        {/* Dynamic Typing Headline */}
        <div className="space-y-4 my-auto py-8">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            Next-Gen Platform for <br />
            <span className="bg-gradient-to-r from-white via-sky-200 to-cyan-300 bg-clip-text text-transparent min-h-[1.2em] inline-block">
              {typingText}
              <span className="animate-pulse text-sky-400">|</span>
            </span>
          </h1>

          <p className="text-sm text-slate-200 font-semibold max-w-md leading-relaxed drop-shadow">
            Authenticate to access branch telemetry, kitchen prep queues, inventory forecasting, and real-time POS analytics.
          </p>

          <div className="space-y-3.5 pt-4">
            <LeftPanelFeatureCard
              icon={CalendarDays}
              title="Automated Table Wizard"
              desc="Real-time guest allocations and floor plan table layout sync."
              delay={0.1}
            />
            <LeftPanelFeatureCard
              icon={Boxes}
              title="Predictive Inventory Costing"
              desc="Low-stock threshold triggers and batch ingredient wastage analytics."
              delay={0.2}
            />
            <LeftPanelFeatureCard
              icon={Users}
              title="Geofenced Staff Roster"
              desc="GPS validated clock-ins, shift compliance, and burnout limit safeguards."
              delay={0.3}
            />
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-300 font-extrabold uppercase tracking-widest">
          <ShieldCheck size={16} className="text-sky-300" />
          <span>JWT ENTERPRISE SECURE ● ACTIVE SYSTEM</span>
        </div>

      </div>

      {/* RIGHT PANEL: UNIFIED DARK GLASS FORM CARD */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full max-w-md"
        >
          <div className="p-8 sm:p-10 bg-[#0B1120]/95 border border-white/20 rounded-[32px] shadow-[0_20px_70px_rgba(0,0,0,0.95)] backdrop-blur-3xl space-y-6 relative overflow-hidden">
            
            {/* Top Specular Rim Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-white to-cyan-400" />

            <div className="flex lg:hidden items-center gap-3 justify-center mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-400 text-black flex items-center justify-center font-black text-xl shadow-md">
                D
              </div>
              <span className="text-white font-black text-xl">DineIn AI</span>
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-black tracking-tight text-white drop-shadow-md">Welcome Back</h3>
              <p className="text-xs text-slate-200 font-bold">
                Log in to initialize workspace operations or{' '}
                <Link to="/register" className="text-sky-300 font-black hover:underline">
                  create an account
                </Link>.
              </p>
            </div>

            {errors.form && (
              <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                
                {/* Username / Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-xs font-black text-white uppercase tracking-wider">
                    Email address or Username <span className="text-sky-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    placeholder="name@restaurant.com or username"
                    className={`w-full px-4 py-3.5 bg-[#030712]/90 border ${
                      errors.email ? 'border-rose-500 focus:ring-rose-500/30' : 'border-white/20 focus:border-sky-400 focus:ring-sky-400/30'
                    } rounded-2xl text-xs text-white placeholder-slate-400 outline-none transition-all duration-200 focus:ring-2 font-bold`}
                    required
                  />
                  {errors.email && <p className="text-xs text-rose-400 font-bold mt-1">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-xs font-black text-white uppercase tracking-wider">
                      Password <span className="text-sky-400">*</span>
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-xs text-sky-400 hover:text-sky-300 font-extrabold transition-all duration-150 cursor-pointer hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: null });
                      }}
                      placeholder="••••••••"
                      className={`w-full pl-4 pr-11 py-3.5 bg-[#030712]/90 border ${
                        errors.password ? 'border-rose-500 focus:ring-rose-500/30' : 'border-white/20 focus:border-sky-400 focus:ring-sky-400/30'
                      } rounded-2xl text-xs text-white placeholder-slate-400 outline-none transition-all duration-200 focus:ring-2 font-bold`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-400 font-bold mt-1">{errors.password}</p>}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <Switch
                    checked={rememberMe}
                    onChange={setRememberMe}
                    label="Remember email address"
                  />
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 text-black font-black text-xs uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(56,189,248,0.5)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/15 text-center">
              <Link to="/" className="text-xs font-bold text-slate-300 hover:text-white transition-colors">
                ← Back to Opening Landing Page
              </Link>
            </div>

          </div>
        </motion.div>

      </div>

    </div>
  );
};

export default Login;
