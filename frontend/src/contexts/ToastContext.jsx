import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertOctagon, AlertTriangle, Info, Loader2 } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000, action = null) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { id, message, type, action }]);

    if (duration > 0 && type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id, { message, type, duration = 4000, action = null }) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message, type, action } : t))
    );
    if (duration > 0 && type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, updateToast }}>
      {children}
      
      {/* Toast Portal Container - Top Right Floating */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 p-4 rounded-xl shadow-2xl border pointer-events-auto backdrop-blur-xl transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-[#080808]/95 border-[#00FF88]/50 text-[#00FF88] glow-neon-green'
                : toast.type === 'error'
                ? 'bg-[#080808]/95 border-[#FF3366]/50 text-[#FF3366] glow-neon-red'
                : toast.type === 'warning'
                ? 'bg-[#080808]/95 border-[#FFE600]/50 text-[#FFE600] glow-neon-yellow'
                : toast.type === 'loading'
                ? 'bg-[#080808]/95 border-[#00D9FF]/50 text-[#00D9FF] glow-neon-blue'
                : 'bg-[#080808]/95 border-[#8B5CF6]/50 text-[#8B5CF6] glow-neon-purple'
            }`}
            style={{
              animation: 'slideInTopRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <div className="flex gap-3 w-full">
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle2 size={18} className="text-[#00FF88]" />}
                {toast.type === 'error' && <AlertOctagon size={18} className="text-[#FF3366]" />}
                {toast.type === 'warning' && <AlertTriangle size={18} className="text-[#FFE600]" />}
                {toast.type === 'loading' && <Loader2 size={18} className="text-[#00D9FF] animate-spin" />}
                {toast.type === 'info' && <Info size={18} className="text-[#8B5CF6]" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-bold text-[#F5F7FA]">{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action.onClick();
                      removeToast(toast.id);
                    }}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-[#00D9FF] hover:underline block pt-1 text-left"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#8B949E] hover:text-[#F5F7FA] shrink-0 mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes slideInTopRight {
          from {
            transform: translateX(2rem);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
