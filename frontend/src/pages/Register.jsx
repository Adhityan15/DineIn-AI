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
import FluidGradientBackground from '../components/FluidGradientBackground';

const LeftPanelFeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
    className="bg-white border border-slate-200/90 p-4 rounded-2xl flex gap-3.5 shadow-sm hover:shadow-md hover:border-slate-400 transition-all select-none"
  >
    <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-md">
      <Icon size={18} />
    </span>
    <div>
      <h4 className="text-slate-900 text-xs font-black">{title}</h4>
      <p className="text-xs text-slate-600 mt-1 leading-normal font-semibold">{desc}</p>
    </div>
  </motion.div>
);

const Register = () => {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(formData);
      addToast('Registration successful! Welcome aboard.', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const resData = err.response?.data;
      let generalMsg = 'Registration failed. Please review your inputs.';

      if (resData && typeof resData === 'object') {
        const fieldErrors = {};
        Object.keys(resData).forEach((key) => {
          const val = resData[key];
          fieldErrors[key] = Array.isArray(val) ? val.join(' ') : String(val);
        });
        setErrors(fieldErrors);
        if (fieldErrors.detail) generalMsg = fieldErrors.detail;
        else if (fieldErrors.non_field_errors) generalMsg = fieldErrors.non_field_errors;
      }

      addToast(generalMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 flex relative overflow-hidden font-sans selection:bg-black selection:text-white">
      
      {/* Dynamic Animated Glass Backdrop */}
      <FluidGradientBackground />

      {/* LEFT PANEL: BRANDING & SYSTEM INSIGHTS */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10 border-r border-slate-200 bg-white/80 backdrop-blur-2xl">
        
        {/* Brand Header */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center border border-slate-800 shadow-md">
              <span className="font-black text-2xl tracking-wider text-white">D</span>
            </div>
            <span className="font-black tracking-tight text-2xl text-slate-900">
              DineIn <span className="text-slate-600">AI</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-black tracking-widest uppercase shadow-md">
            <Sparkles size={15} className="animate-pulse text-white" />
            <span>OPERATIONAL ENTERPRISE PORTAL</span>
          </div>
        </div>

        {/* Dynamic Typing Headline */}
        <div className="space-y-4 my-auto py-8">
          <h1 className="text-4xl xl:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Initialize Platform <br />
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent min-h-[1.2em] inline-block">
              {typingText}
              <span className="animate-pulse text-black">|</span>
            </span>
          </h1>

          <p className="text-sm text-slate-700 font-bold max-w-md leading-relaxed">
            Create an operational profile to manage branch telemetry, AI table reservations, inventory forecasting, and staff rosters.
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
        <div className="flex items-center gap-2 text-xs text-slate-900 font-extrabold uppercase tracking-widest">
          <ShieldCheck size={16} className="text-slate-900" />
          <span>JWT ENTERPRISE SECURE ● ACTIVE SYSTEM</span>
        </div>

      </div>

      {/* RIGHT PANEL: UNIFIED WHITE & BLACK GLASS REGISTER FORM CARD */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full max-w-md my-8"
        >
          <div className="p-8 sm:p-10 bg-white/95 border border-slate-200 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] backdrop-blur-3xl space-y-6 relative overflow-hidden">
            
            {/* Top Specular Rim Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-slate-700 to-black" />

            <div className="flex lg:hidden items-center gap-3 justify-center mb-2">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl shadow-md">
                D
              </div>
              <span className="text-slate-900 font-black text-xl">DineIn AI</span>
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-black tracking-tight text-slate-900">Create Account</h3>
              <p className="text-xs text-slate-700 font-bold">
                Register to initialize workspace operations or{' '}
                <Link to="/login" className="text-black font-black underline">
                  sign in to your account
                </Link>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Names Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-black font-bold"
                    required
                  />
                  {errors.first_name && <p className="text-xs text-rose-500 font-bold">{errors.first_name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-black font-bold"
                    required
                  />
                  {errors.last_name && <p className="text-xs text-rose-500 font-bold">{errors.last_name}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@restaurant.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-black font-bold"
                  required
                />
                {errors.email && <p className="text-xs text-rose-500 font-bold">{errors.email}</p>}
              </div>

              {/* Username & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="john_doe"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-black font-bold"
                    required
                  />
                  {errors.username && <p className="text-xs text-rose-500 font-bold">{errors.username}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 555-0198"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-black font-bold"
                  />
                </div>
              </div>

              {/* Account Role Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Account Role <span className="text-rose-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 outline-none focus:border-black font-bold cursor-pointer"
                >
                  <option value="customer">Customer</option>
                  <option value="owner">Restaurant Owner</option>
                  <option value="manager">Restaurant Manager</option>
                  <option value="receptionist">Receptionist / Host</option>
                  <option value="kitchen_staff">Kitchen Staff</option>
                </select>
              </div>

              {/* Passwords Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-black font-bold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-black"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-500 font-bold">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="password_confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.password_confirm}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-black font-bold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-black"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password_confirm && <p className="text-xs text-rose-500 font-bold">{errors.password_confirm}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white font-black text-xs uppercase tracking-wider rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:bg-slate-800 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <span>Initializing Profile...</span>
                ) : (
                  <>
                    <span>Create Enterprise Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 text-center">
              <Link to="/" className="text-xs font-extrabold text-slate-700 hover:text-black transition-colors">
                ← Back to Opening Landing Page
              </Link>
            </div>

          </div>
        </motion.div>

      </div>

    </div>
  );
};

export default Register;
