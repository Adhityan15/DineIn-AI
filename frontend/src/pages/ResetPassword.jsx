import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Mail, Lock, Key, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { PrimaryButton, SecondaryButton, GlassCard, Input } from '../components/DesignSystem';

const ResetPassword = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: '',
    token: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    const urlEmail = searchParams.get('email');
    if (urlToken || urlEmail) {
      setFormData((prev) => ({
        ...prev,
        token: urlToken || prev.token,
        email: urlEmail || prev.email,
      }));
    }
  }, [searchParams]);

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.email.trim()) tempErrors.email = 'Email or Username is required.';
    if (!formData.token.trim()) tempErrors.token = 'Reset token is required.';
    
    if (formData.new_password.length < 8) {
      tempErrors.new_password = 'Password must be at least 8 characters.';
    }

    if (formData.new_password !== formData.confirm_password) {
      tempErrors.confirm_password = 'Passwords do not match.';
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
    try {
      await client.post('/auth/reset-password/', {
        email: formData.email.trim(),
        token: formData.token.trim(),
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });
      addToast('Password reset successfully. Please sign in with your new password!', 'success');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.detail || 'Failed to reset password. Verify your token.';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-[#F5F7FA]">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--color-primary)]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-indigo-400/20">
            <span className="text-white font-extrabold text-2xl">D</span>
          </div>
        </div>
        
        <h2 className="text-3xl font-extrabold tracking-tight text-[#F5F7FA]">
          Reset Your Password
        </h2>
        <p className="text-xs text-[#8B949E] max-w-sm mx-auto">
          Set a new password for your DineIn AI account to restore access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <GlassCard className="py-8 px-6 sm:px-10 bg-[#0D0D0D]/90 border-[#1E2430] rounded-[24px] shadow-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email / Username */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider">
                Email Address or Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-4 py-2.5 bg-[#050505] border rounded-app-xl text-xs text-[#F5F7FA] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/20 focus:border-[#00D9FF] transition-all ${
                    errors.email ? 'border-[#FF3366]' : 'border-[#1E2430]'
                  }`}
                  placeholder="name@restaurant.com or username"
                  required
                />
              </div>
              {errors.email && <p className="text-xs text-[#FF3366] font-bold mt-1">{errors.email}</p>}
            </div>

            {/* Recovery Token */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider">
                Recovery Token
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key size={16} />
                </span>
                <input
                  name="token"
                  type="text"
                  value={formData.token}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-4 py-2.5 bg-[#050505] border rounded-app-xl text-xs font-mono text-[#00D9FF] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/20 focus:border-[#00D9FF] transition-all ${
                    errors.token ? 'border-[#FF3366]' : 'border-[#1E2430]'
                  }`}
                  placeholder="Paste recovery token UUID"
                  required
                />
              </div>
              {errors.token && <p className="text-xs text-[#FF3366] font-bold mt-1">{errors.token}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  name="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2.5 bg-[#050505] border rounded-app-xl text-xs text-[#F5F7FA] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/20 focus:border-[#00D9FF] transition-all ${
                    errors.new_password ? 'border-[#FF3366]' : 'border-[#1E2430]'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.new_password && <p className="text-xs text-[#FF3366] font-bold mt-1">{errors.new_password}</p>}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2.5 bg-[#050505] border rounded-app-xl text-xs text-[#F5F7FA] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/20 focus:border-[#00D9FF] transition-all ${
                    errors.confirm_password ? 'border-[#FF3366]' : 'border-[#1E2430]'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-xs text-[#FF3366] font-bold mt-1">{errors.confirm_password}</p>}
            </div>

            {/* Requirements checklist */}
            <div className="p-3 bg-[#151515] border border-[#1E2430] rounded-app-lg text-[10px] space-y-1 text-[#8B949E]">
              <div className="font-extrabold uppercase text-[#F5F7FA] mb-1">Password Requirements:</div>
              <div className={`flex items-center gap-1.5 ${formData.new_password.length >= 8 ? 'text-[#00FF88]' : ''}`}>
                <CheckCircle2 size={12} /> Minimum 8 characters
              </div>
              <div className={`flex items-center gap-1.5 ${formData.new_password && formData.new_password === formData.confirm_password ? 'text-[#00FF88]' : ''}`}>
                <CheckCircle2 size={12} /> Passwords must match
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <PrimaryButton
                type="submit"
                loading={loading}
                className="w-full py-3 h-11 text-xs font-bold shadow-[0_4px_16px_rgba(0,217,255,0.25)] rounded-app-xl"
              >
                {loading ? 'Resetting password...' : 'Reset Password'}
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-6 border-t border-[#1E2430] pt-4 flex items-center justify-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-[#8B949E] hover:text-[#F5F7FA] transition-colors">
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ResetPassword;
