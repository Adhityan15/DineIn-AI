import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  ArrowRight, 
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
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  Input,
  Select
} from '../components/DesignSystem';

const LeftPanelFeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3.5 hover:bg-white/10 hover:border-white/20 transition-all select-none"
  >
    <span className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
      <Icon size={18} />
    </span>
    <div>
      <h4 className="text-white text-xs font-bold">{title}</h4>
      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold">{desc}</p>
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

  // Typing animation tagline strings
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

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be 8+ characters.';
    if (!/[A-Z]/.test(pwd)) return 'Must contain an uppercase letter.';
    if (!/[a-z]/.test(pwd)) return 'Must contain a lowercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Must contain a number.';
    if (!/[!@#$%^&*()_+-=[\]{}|;':",./<>?]/.test(pwd)) return 'Must contain a special character.';
    return null;
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.email.trim()) tempErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = 'Invalid email format.';
    
    if (!formData.username.trim()) tempErrors.username = 'Username is required.';
    if (!formData.first_name.trim()) tempErrors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) tempErrors.last_name = 'Last name is required.';
    
    if (!formData.phone.trim()) tempErrors.phone = 'Phone number is required.';
    else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      tempErrors.phone = 'Invalid phone format (e.g., +15005550006).';
    }

    const pwdErr = validatePassword(formData.password);
    if (pwdErr) tempErrors.password = pwdErr;

    if (formData.password !== formData.password_confirm) {
      tempErrors.password_confirm = 'Passwords do not match.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      addToast('Registration successful! Please sign in.', 'success');
      navigate('/login');
    } else {
      addToast(result.error, 'error');
    }
  };

  const roleOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'receptionist', label: 'Receptionist / Service Staff' },
    { value: 'kitchen_staff', label: 'Kitchen Staff / Chef' },
    { value: 'inventory_manager', label: 'Inventory Manager' },
    { value: 'manager', label: 'Restaurant Manager' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden font-sans text-slate-100">
      
      {/* Background animated aurora glow widgets */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* LEFT PANEL: BRANDING & FEATURES (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 border-r border-white/5 relative z-10 bg-slate-950/20 backdrop-blur-md">
        
        {/* Top Header Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center border border-indigo-400/20 shadow-[0_0_24px_rgba(99,102,241,0.25)]">
            <span className="text-white font-extrabold text-lg tracking-wider">D</span>
          </div>
          <span className="text-white font-black tracking-tight text-lg">DineIn AI</span>
        </div>

        {/* Center tagline and typing animation */}
        <div className="space-y-6 max-w-md">
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Operations <br />
              Management
            </h2>
            <div className="text-indigo-400 text-sm font-extrabold uppercase tracking-widest flex items-center gap-1.5 h-6">
              <Sparkles size={14} className="animate-pulse text-indigo-400" />
              <span>{typingText}</span>
              <span className="w-[2px] h-4 bg-indigo-400 animate-blink shrink-0" />
            </div>
          </div>

          {/* Seeds feature cards lists */}
          <div className="space-y-4">
            <LeftPanelFeatureCard icon={CalendarDays} title="AI Reservation Engine" desc="Live booking wizard matrices mapping dynamic SVG layout designs." delay={0.1} />
            <LeftPanelFeatureCard icon={Boxes} title="Inventory Prediction Cost" desc="Tracks low-stock parameters and wastage cost analysis points." delay={0.2} />
            <LeftPanelFeatureCard icon={Users} title="Workforce Compliance Roster" desc="Roster clocks compliant geofencing and burnout limits." delay={0.3} />
          </div>
        </div>

        {/* Bottom systems confirmation badge */}
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase select-none">
          <ShieldCheck size={14} className="text-app-success" />
          JWT secure cloud platform ● certified compliant
        </div>

      </div>

      {/* RIGHT PANEL: GLASS REGISTER CARD */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        
        {/* Glass Card form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
          className="w-full max-w-md my-8"
        >
          <GlassCard className="p-8 sm:p-10 border-white/10 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            
            {/* Logo for mobile headers */}
            <div className="flex lg:hidden items-center gap-2 mb-6 justify-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">D</span>
              </div>
              <span className="text-white font-black text-sm">DineIn AI</span>
            </div>

            <div className="space-y-2 text-center mb-8">
              <h3 className="text-2xl font-extrabold tracking-tight text-white">Create Account</h3>
              <p className="text-xs text-slate-400">
                Register to initialize workspace operations or{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-extrabold transition-colors">
                  sign in to your account
                </Link>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Split Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  error={errors.first_name}
                />
                <Input
                  label="Last Name"
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  error={errors.last_name}
                />
              </div>

              {/* Email Field */}
              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@restaurant.com"
                required
                error={errors.email}
              />

              {/* Username & Phone grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Username"
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="john_doe"
                  required
                  error={errors.username}
                />
                <Input
                  label="Phone Number"
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+15005550006"
                  required
                  error={errors.phone}
                />
              </div>

              {/* Split Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="password" className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-3 pr-10 py-2 bg-app-elevated border ${
                        errors.password ? 'border-app-danger/60 focus:ring-app-danger/20' : 'border-app-border focus:border-app-primary focus:ring-app-primary/10'
                      } rounded-app-lg text-xs outline-none text-text-primary transition-all duration-150 focus:ring-2 placeholder-text-muted/60`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] font-semibold text-app-danger mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-1">
                  <label htmlFor="password_confirm" className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="password_confirm"
                      name="password_confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.password_confirm}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-3 pr-10 py-2 bg-app-elevated border ${
                        errors.password_confirm ? 'border-app-danger/60 focus:ring-app-danger/20' : 'border-app-border focus:border-app-primary focus:ring-app-primary/10'
                      } rounded-app-lg text-xs outline-none text-text-primary transition-all duration-150 focus:ring-2 placeholder-text-muted/60`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password_confirm && <p className="text-[10px] font-semibold text-app-danger mt-1">{errors.password_confirm}</p>}
                </div>
              </div>

              {/* Role Dropdown */}
              <Select
                label="Primary System Role"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={roleOptions}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <PrimaryButton 
                  type="submit" 
                  loading={loading}
                  className="w-full py-3 h-11 text-xs font-bold shadow-[0_4px_16px_rgba(99,102,241,0.25)] rounded-app-xl"
                >
                  Create Account
                </PrimaryButton>
              </div>
            </form>

            <div className="mt-6 flex flex-col items-center gap-2 pt-4 border-t border-white/5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Already registered?</span>
              <SecondaryButton
                onClick={() => navigate('/login')}
                className="w-full py-2.5 text-xs font-bold rounded-app-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white"
              >
                Sign In
              </SecondaryButton>
            </div>

            <div className="mt-6 text-center text-[10px] text-slate-500 font-semibold select-none">
              Need assistance?{' '}
              <a href="mailto:support@dinein.com" className="text-indigo-400 hover:underline">
                Contact Technical Support
              </a>
            </div>

          </GlassCard>
        </motion.div>

        {/* Footer info panels */}
        <div className="mt-8 text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest select-none">
          © {new Date().getFullYear()} DineIn AI. All rights reserved.
        </div>

      </div>

    </div>
  );
};

export default Register;
