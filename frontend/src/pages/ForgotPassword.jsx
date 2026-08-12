import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Mail, Loader2, ArrowLeft, CheckCircle2, Key, ExternalLink } from 'lucide-react';
import { PrimaryButton, SecondaryButton, GlassCard, Input } from '../components/DesignSystem';

const ForgotPassword = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [devResetData, setDevResetData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) {
      setError('Email address or Username is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await client.post('/auth/forgot-password/', { email: emailOrUsername.trim() });
      setSubmitted(true);
      const devInfo = res.data.data || res.data;
      if (devInfo?.dev_reset_token) {
        setDevResetData(devInfo);
      }
      addToast('Password reset instructions generated.', 'success', 6000);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to dispatch reset request. Please check inputs.';
      setError(message);
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
          Forgot Password?
        </h2>
        <p className="text-xs text-[#8B949E] max-w-sm mx-auto">
          Enter your registered email address or username and we'll help you recover access to your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <GlassCard className="py-8 px-6 sm:px-10 bg-[#0D0D0D]/90 border-[#1E2430] rounded-[24px] shadow-2xl">
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider mb-1">
                  Email Address or Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => {
                      setEmailOrUsername(e.target.value);
                      if (error) setError('');
                    }}
                    className={`block w-full pl-10 pr-4 py-2.5 bg-[#050505] border rounded-app-xl text-xs text-[#F5F7FA] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/20 focus:border-[#00D9FF] transition-all ${
                      error ? 'border-[#FF3366]' : 'border-[#1E2430]'
                    }`}
                    placeholder="name@restaurant.com or username"
                  />
                </div>
                {error && <p className="mt-1 text-xs text-[#FF3366] font-bold">{error}</p>}
              </div>

              <div>
                <PrimaryButton
                  type="submit"
                  loading={loading}
                  className="w-full py-3 h-11 text-xs font-bold shadow-[0_4px_16px_rgba(0,217,255,0.25)] rounded-app-xl"
                >
                  {loading ? 'Dispatching reset instructions...' : 'Send Reset Instructions'}
                </PrimaryButton>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-[#F5F7FA]">Reset Instructions Generated</h3>
              <p className="text-xs text-[#8B949E]">
                If an account exists for <strong>{emailOrUsername}</strong>, password reset instructions have been generated.
              </p>

              {devResetData && (
                <div className="p-4 bg-[#151515] border border-[#00FF88]/40 rounded-app-xl text-left space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#00FF88] uppercase tracking-wider">
                    <Key size={12} />
                    Development Reset Link Generated
                  </div>
                  <p className="text-[11px] text-[#8B949E] font-mono break-all bg-[#050505] p-2 rounded border border-[#1E2430]">
                    Token: <span className="text-[#00D9FF]">{devResetData.dev_reset_token}</span>
                  </p>
                  <PrimaryButton
                    onClick={() => navigate(`/reset-password?token=${devResetData.dev_reset_token}&email=${encodeURIComponent(devResetData.email || emailOrUsername)}`)}
                    className="w-full py-2 text-xs font-bold mt-2"
                  >
                    Reset Password Now <ExternalLink size={14} />
                  </PrimaryButton>
                </div>
              )}
            </div>
          )}

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

export default ForgotPassword;
