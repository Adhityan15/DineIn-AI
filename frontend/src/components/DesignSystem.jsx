import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, X, Info } from 'lucide-react';

/* ==========================================================================
   1. BUTTONS SUITE (Apple Glass Pills)
   ========================================================================== */

export const PrimaryButton = ({ children, onClick, disabled, loading, icon: Icon, className = '', type = 'button' }) => {
  return (
    <motion.button
      whileHover={{ y: -1.5, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`px-4 py-2 bg-white text-black font-extrabold text-xs rounded-full shadow-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin text-black" /> : Icon && <Icon size={14} className="text-black" />}
      <span className="text-black font-extrabold">{children}</span>
    </motion.button>
  );
};

export const SecondaryButton = ({ children, onClick, disabled, loading, icon: Icon, className = '', type = 'button' }) => {
  return (
    <motion.button
      whileHover={{ y: -1, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`px-4 py-2 bg-black/80 dark:bg-black/90 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 hover:border-white/40 text-xs font-bold rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin text-white" /> : Icon && <Icon size={14} className="text-white" />}
      <span className="text-white font-bold">{children}</span>
    </motion.button>
  );
};

export const GhostButton = ({ children, onClick, disabled, loading, icon: Icon, className = '', type = 'button' }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.04, backgroundColor: 'var(--color-hover)' }}
      whileTap={{ scale: 0.95 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`px-3 py-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-all duration-200 focus:outline-none ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon && <Icon size={14} />}
      {children}
    </motion.button>
  );
};

export const DangerButton = ({ children, onClick, disabled, loading, icon: Icon, className = '', type = 'button' }) => {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.03, boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)' }}
      whileTap={{ scale: 0.95 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`px-4 py-2 bg-[var(--color-danger)] text-white font-extrabold text-xs rounded-full shadow-app-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon && <Icon size={14} />}
      {children}
    </motion.button>
  );
};

/* ==========================================================================
   2. CARDS SUITE (Apple & visionOS Liquid Glass)
   ========================================================================== */

export const AppCard = ({ children, className = '', hoverEffect = false, onClick }) => {
  const cardProps = hoverEffect
    ? {
        whileHover: { 
          y: -6, 
          scale: 1.015,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.45)',
          borderColor: 'var(--color-primary)'
        },
        transition: { type: 'spring', stiffness: 400, damping: 22 },
      }
    : {};

  const Tag = hoverEffect || onClick ? motion.div : 'div';

  return (
    <Tag
      {...cardProps}
      onClick={onClick}
      className={`glass-card-surface backdrop-blur-2xl border rounded-[26px] p-6 theme-transition relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 3D Glass Specular Reflection Highlight Rims */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/40 to-white/0 pointer-events-none" />
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-white/30 via-white/5 to-white/0 pointer-events-none" />
      {children}
    </Tag>
  );
};

export const GlassCard = AppCard;

export const SectionCard = ({ children, title, subtitle, action, className = '' }) => {
  return (
    <AppCard className={`flex flex-col gap-app-20 relative overflow-hidden group ${className}`}>
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div>
          <h3 className="text-sm font-black text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] animate-pulse" />
            {title}
          </h3>
          {subtitle && <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </AppCard>
  );
};

export const ChartCard = ({ children, title, subtitle, legend, className = '' }) => {
  return (
    <AppCard className={`flex flex-col gap-app-16 relative overflow-hidden group hover:border-[var(--color-primary)]/50 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">{title}</h3>
          {subtitle && <p className="text-base font-black text-[var(--color-text-primary)] tracking-tight mt-0.5">{subtitle}</p>}
        </div>
        {legend && <div className="flex items-center gap-3">{legend}</div>}
      </div>
      <div className="flex-1 min-h-[200px] flex items-center justify-center relative">{children}</div>
    </AppCard>
  );
};

/* ==========================================================================
   3. APPLE / VISIONOS REFRACTIVE FROSTED GLASS KPI CARD
   ========================================================================== */

export const KPICard = ({ title, value, change, trend = 'up', icon: Icon, description, className = '' }) => {
  const isPositive = trend === 'up';
  const strokeColor = isPositive ? "var(--color-success)" : "var(--color-danger)";
  const gradientId = isPositive ? "greenGrad" : "redGrad";
  const glowEdgeClass = isPositive ? "glow-edge-green" : "glow-edge-red";
  
  return (
    <AppCard hoverEffect className={`relative overflow-hidden group rounded-[28px] ${glowEdgeClass} ${className}`}>
      {/* Background Glowing Mesh Sphere */}
      <div className={`absolute -right-10 -top-10 w-36 h-36 rounded-full blur-[60px] pointer-events-none transition-all duration-300 group-hover:scale-125 opacity-70 ${
        isPositive ? 'bg-[var(--color-success)]/20' : 'bg-[var(--color-danger)]/20'
      }`} />

      {/* Top Glass Specular Light Reflection */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:via-[var(--color-primary)] transition-all duration-300 pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block">{title}</span>
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
              {typeof value === 'number' || !isNaN(parseInt(value, 10)) ? (
                <AnimatedCounter value={value} />
              ) : value}
            </h2>
            {change && (
              <motion.span 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`text-[10px] font-black px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-md backdrop-blur-md ${
                  isPositive 
                    ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/40 shadow-[0_0_12px_rgba(0,255,136,0.25)]' 
                    : 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/40 shadow-[0_0_12px_rgba(255,56,100,0.25)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-[var(--color-success)] shadow-[0_0_6px_var(--color-success)]' : 'bg-[var(--color-danger)] shadow-[0_0_6px_var(--color-danger)]'}`} />
                {isPositive ? '↑' : '↓'} {change}
              </motion.span>
            )}
          </div>
        </div>
        
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/15 flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/60 group-hover:scale-110 transition-all duration-300 shadow-lg">
            <Icon size={20} />
          </div>
        )}
      </div>
      
      {/* 3D Dual Ribbon Waveform Line Chart Overlay (Matching Reference Screenshot) */}
      <div className="h-11 w-full mt-4 flex items-center justify-between relative z-10">
        {description ? (
          <span className="text-[10px] text-[var(--color-text-muted)] font-bold truncate max-w-[50%]">
            {description}
          </span>
        ) : <div />}
        
        <div className="w-32 h-10 shrink-0 relative overflow-hidden">
          <svg className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(0,255,136,0.35)]" viewBox="0 0 100 35" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="neonRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="50%" stopColor="#9B5CFF" />
                <stop offset="100%" stopColor="#00FF88" />
              </linearGradient>
            </defs>
            <path
              d={isPositive ? "M0 26 Q 25 12, 50 20 T 100 8 L 100 35 L 0 35 Z" : "M0 8 Q 25 24, 50 16 T 100 30 L 100 35 L 0 35 Z"}
              fill={`url(#${gradientId})`}
            />
            {/* Single Smooth Glowing 3D Ribbon Wave */}
            <path
              d={isPositive ? "M0 26 Q 25 12, 50 20 T 100 8" : "M0 8 Q 25 24, 50 16 T 100 30"}
              fill="none"
              stroke="url(#neonRibbonGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-waveform-line"
            />
          </svg>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-purple)] to-transparent opacity-50 group-hover:opacity-100 transition-all duration-300"></div>
    </AppCard>
  );
};

export const StatCard = KPICard;

/* ==========================================================================
   4. INPUTS SUITE
   ========================================================================== */

export const Input = ({ label, type = 'text', value, onChange, placeholder, error, disabled, required, className = '', ...props }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
          {label} {required && <span className="text-[var(--color-danger)]">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-full px-4 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]' : ''
        }`}
        {...props}
      />
      {error && <p className="text-[10px] font-semibold text-[var(--color-danger)] flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
};

export const Select = ({ label, value, onChange, options = [], error, disabled, required, className = '', children, ...props }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
          {label} {required && <span className="text-[var(--color-danger)]">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-[#0F172A] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-full px-4 py-2 text-xs text-[#F8FAFC] outline-none transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
          error ? 'border-[var(--color-danger)]' : ''
        }`}
        {...props}
      >
        {children ? children : options.map((opt, idx) => (
          <option key={idx} value={typeof opt === 'object' ? opt.value : opt} className="bg-[#0F172A] text-[#F8FAFC]">
            {typeof opt === 'object' ? opt.label : opt}
          </option>
        ))}
      </select>
      {error && <p className="text-[10px] font-semibold text-[var(--color-danger)] flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
};

export const FloatingInput = ({ label, type = 'text', value, onChange, placeholder, error, disabled, required, className = '', ...props }) => {
  return (
    <Input
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      required={required}
      className={className}
      {...props}
    />
  );
};

export const Textarea = ({ label, value, onChange, placeholder, rows = 3, error, disabled, required, className = '', ...props }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
          {label} {required && <span className="text-[var(--color-danger)]">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-[20px] px-4 py-2.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
          error ? 'border-[var(--color-danger)]' : ''
        }`}
        {...props}
      />
      {error && <p className="text-[10px] font-semibold text-[var(--color-danger)] flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
};

export const Switch = ({ checked, onChange, label, disabled = false, className = '' }) => {
  return (
    <label className={`inline-flex items-center gap-2.5 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div 
        onClick={() => !disabled && onChange && onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
          checked ? 'bg-[var(--color-primary)] shadow-[0_0_12px_var(--color-primary)]/40' : 'bg-[var(--color-border)]'
        }`}
      >
        <div 
          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      {label && <span className="text-xs font-semibold text-[var(--color-text-secondary)] select-none">{label}</span>}
    </label>
  );
};

/* ==========================================================================
   5. UTILITY COMPONENTS
   ========================================================================== */

export const AnimatedCounter = ({ value, duration = 1 }) => {
  const numValue = typeof value === 'number' ? value : parseInt(value, 10) || 0;
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = numValue;
    if (start === end) {
      setCount(end);
      return;
    }
    const durationMs = duration * 1000;
    const incrementTime = 20;
    const steps = durationMs / incrementTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variantStyles = {
    primary: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/30',
    success: 'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/30',
    warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/30',
    danger: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/30',
    purple: 'bg-[var(--color-purple)]/15 text-[var(--color-purple)] border-[var(--color-purple)]/30',
    muted: 'bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
  };

  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border shadow-sm inline-flex items-center gap-1 ${variantStyles[variant] || variantStyles.primary} ${className}`}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`glass-card-surface w-full ${maxWidth} rounded-[28px] border border-[var(--color-border)] shadow-2xl p-6 relative z-10 space-y-4 max-h-[90vh] flex flex-col`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] shrink-0">
            <h3 className="text-sm font-black text-[var(--color-text-primary)] tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="absolute inset-0 bg-[var(--color-bg-app)]/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-[22px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        <span className="text-xs font-bold text-[var(--color-text-primary)] tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export const Drawer = ({ isOpen, onClose, title, children, width = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className={`glass-card-surface h-full w-full ${width} border-l border-[var(--color-border)] shadow-2xl p-6 relative z-10 space-y-4 flex flex-col rounded-none`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] shrink-0">
            <h3 className="text-sm font-black text-[var(--color-text-primary)] tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const EmptyState = ({ icon: Icon = Info, title = 'No records found', description, action }) => {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center gap-3 glass-card-surface rounded-[24px]">
      <div className="w-12 h-12 rounded-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] shadow-sm">
        <Icon size={24} />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-extrabold text-[var(--color-text-primary)]">{title}</h4>
        {description && <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export const SectionHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex items-center justify-between pb-3 border-b border-[var(--color-border)] ${className}`}>
      <div>
        <h3 className="text-sm font-black text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] animate-pulse" />
          {title}
        </h3>
        {subtitle && <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`bg-[var(--color-bg-surface-elevated)] animate-pulse rounded-xl ${className}`} />
  );
};

export const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex gap-1.5 p-1 bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] rounded-full backdrop-blur-md ${className}`}>
      {tabs.map((tab) => {
        const id = tab.id || tab;
        const label = tab.label || tab;
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange && onChange(id)}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-full transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export const DataTable = ({ columns = [], data = [], emptyMessage = 'No data available' }) => {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto w-full glass-card-surface rounded-[22px] border border-[var(--color-border)]">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-muted)] font-extrabold uppercase text-[9px] tracking-wider">
            {columns.map((col, idx) => (
              <th key={idx} className="p-3.5">{col.header || col.accessorKey}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold">
          {data.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-[var(--color-hover)] transition-colors">
              {columns.map((col, cIdx) => (
                <td key={cIdx} className="p-3.5">
                  {col.cell ? col.cell({ row, value: row[col.accessorKey] }) : row[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
