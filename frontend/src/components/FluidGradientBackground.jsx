import React from 'react';

const FluidGradientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-transparent">
      {/* Light Crystalline Atmospheric Canvas */}
      <div className="absolute inset-0 bg-[#F0F4F8] -z-10" />

      {/* Floating Translucent Fluid Spheres */}
      <div className="absolute -top-[10%] -left-[5%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-slate-200/50 via-slate-100/40 to-transparent blur-[110px] opacity-70 animate-fluid-morph-1" />
      <div className="absolute -bottom-[10%] -right-[5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-slate-300/40 via-slate-200/30 to-transparent blur-[120px] opacity-60 animate-fluid-morph-2" />

      {/* Fine Subtle Geometric Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:36px_36px] opacity-40" />
    </div>
  );
};

export default FluidGradientBackground;
