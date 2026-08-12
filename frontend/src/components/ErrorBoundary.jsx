import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GlassCard, PrimaryButton } from './DesignSystem';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard subpage caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto mt-12">
          <GlassCard className="p-6 border-red-500/25 space-y-4 shadow-[0_8px_32px_rgba(239,68,68,0.1)]">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Module Load Failure</h3>
                <p className="text-[10px] text-text-muted font-bold mt-0.5">A runtime exception occurred in this ERP workspace.</p>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-text-secondary leading-normal bg-black/35 p-3 rounded-lg border border-white/5 font-mono text-rose-300 break-words">
              {this.state.error?.toString() || "Unknown React component rendering error"}
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <PrimaryButton 
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <RefreshCw size={13} />
                Reload ERP Console
              </PrimaryButton>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
