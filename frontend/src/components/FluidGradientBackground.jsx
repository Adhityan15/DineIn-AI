import React from 'react';

const FluidGradientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-transparent">
      {/* Dark Mode Register-Theme Base Backdrop Overlay */}
      <div className="hidden dark:block absolute inset-0 bg-[#0B0F19] -z-10" />

      {/* Register Page Ambient Aurora Glow Widgets */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 right-1/3 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" />

      {/* Register Page 32px Fine Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
    </div>
  );
};

export default FluidGradientBackground;
