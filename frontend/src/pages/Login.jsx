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
  EyeOff
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  PrimaryButton,
  Switch
} from '../components/DesignSystem';
import FluidGradientBackground from '../components/FluidGradientBackground';

const LeftPanelFeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3.5 hover:bg-white/10 hover:border-white/20 transition-all select-none"
  >
    <span className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
      <Icon size={18} />
    </span>
    <div>
      <h4 className="text-white text-xs font-bold">{title}</h4>
      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold">{desc}</p>
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
  const [loadingStep, setLoadingStep] = useState(0);
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
      tempErrors.email = 'Email or Username is required.';
    }
    if (!password) {
      tempErrors.password = 'Password is required.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setLoadingStep(1);

    const result = await login(email, password);

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      addToast('Login successful. Welcome back!', 'success');
      navigate('/dashboard', { replace: true });
    } else {
      setLoading(false);
      setLoadingStep(0);
      addToast(result.error, 'error');
    }
  };

  const getLoadingMessage = () => {
    if (loadingStep === 1) return 'Authenticating credentials...';
    if (loadingStep === 2) return 'Fetching workspace...';
    if (loadingStep === 3) return 'Initializing DineIn AI...';
    return 'Sign In';
  };

  return (
    <div className="dark min-h-screen bg-[#030712] flex relative overflow-hidden font-sans text-slate-100">
      
      {/* 4K Animated 3D Fluid Gradient Motion Background */}
      <FluidGradientBackground />

      {/* LEFT PANEL: BRANDING & ANIMATED FEATURE CARDS */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 border-r border-white/10 relative z-10 bg-[#030712]/70 backdrop-blur-xl">
        
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center border border-cyan-400/40 shadow-[0_0_28px_rgba(0,229,255,0.4)] animate-pulse">
            <span className="text-white font-black text-xl tracking-wider">D</span>
          </div>
          <span className="text-white font-black tracking-tight text-2xl">DineIn <span className="text-cyan-400">AI</span></span>
        </div>

        <div className="space-y-6 max-w-md">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
              Enterprise Operations <br />
              Management
            </h2>
            <div className="text-cyan-400 text-sm font-extrabold uppercase tracking-widest flex items-center gap-1.5 h-6">
              <Sparkles size={16} className="animate-pulse text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">{typingText}</span>
              <span className="w-[2.5px] h-4 bg-cyan-400 animate-blink shrink-0" />
            </div>
          </div>

          <div className="space-y-4">
            <LeftPanelFeatureCard icon={CalendarDays} title="AI Reservation Engine" desc="Live booking wizard matrices mapping dynamic table layout designs." delay={0.1} />
            <LeftPanelFeatureCard icon={Boxes} title="Inventory Prediction Cost" desc="Tracks low-stock parameters and wastage cost analysis points." delay={0.2} />
            <LeftPanelFeatureCard icon={Users} title="Workforce Compliance Roster" desc="Roster clocks compliant geofencing and burnout limits." delay={0.3} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300 text-xs font-extrabold uppercase select-none">
          <ShieldCheck size={16} className="text-[#00FF88] animate-pulse" />
          JWT secure enterprise platform ● certified active
        </div>

      </div>

      {/* RIGHT PANEL: HIGH-CONTRAST ANIMATED DARK GLASS LOGIN CARD */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full max-w-md"
        >
          <div className="p-8 sm:p-10 bg-[#0B1120]/90 border border-cyan-500/30 rounded-[30px] shadow-[0_20px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(0,229,255,0.20)] backdrop-blur-2xl space-y-6 relative overflow-hidden">
            
            {/* Top Specular Glass Rim Highlight */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-purple-500" />

            <div className="flex lg:hidden items-center gap-2.5 justify-center mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="text-white font-black text-lg">DineIn AI</span>
            </div>

            <div className="space-y-1.5 text-center">
              <h3 className="text-2xl font-black tracking-tight text-white">Welcome Back</h3>
              <p className="text-xs text-slate-300 font-medium">
                Log in to initialize workspace intelligence registries or{' '}
                <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-extrabold transition-colors underline">
                  create an account
                </Link>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                
                {/* Username / Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Email address or Username <span className="text-rose-400">*</span>
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
                    className={`w-full px-4 py-3 bg-[#030712] border ${
                      errors.email ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/25'
                    } rounded-2xl text-xs text-white placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 font-semibold`}
                    required
                  />
                  {errors.email && <p className="text-xs text-rose-400 font-bold mt-1">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-extrabold transition-all duration-150 cursor-pointer hover:underline"
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
                      className={`w-full pl-4 pr-11 py-3 bg-[#030712] border ${
                        errors.password ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/25'
                      } rounded-2xl text-xs text-white placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 font-semibold`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-400 font-bold mt-1">{errors.password}</p>}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1 select-none">
                  <Switch
                    label="Remember Me"
                    checked={rememberMe}
                    onChange={(checked) => setRememberMe(checked)}
                    className="text-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <PrimaryButton 
                  type="submit" 
                  loading={loading}
                  className="w-full py-3.5 h-12 text-xs font-black bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white rounded-2xl shadow-[0_8px_25px_rgba(0,229,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {getLoadingMessage()}
                </PrimaryButton>
              </div>
            </form>

            {/* Create Account Action */}
            <div className="mt-6 flex flex-col items-center gap-3 pt-5 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">New to the platform?</span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full py-3 text-xs font-bold rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 hover:border-cyan-400/40 text-white transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
              >
                Create Account
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400 font-medium select-none">
              Need assistance?{' '}
              <a href="mailto:support@dinein.com" className="text-cyan-400 font-bold hover:underline">
                Contact Technical Support
              </a>
            </div>

          </div>
        </motion.div>

        <div className="mt-8 text-center text-xs text-slate-500 font-bold uppercase tracking-widest select-none">
          © {new Date().getFullYear()} DineIn AI. All rights reserved.
        </div>

      </div>

    </div>
  );

};

export default Login;
