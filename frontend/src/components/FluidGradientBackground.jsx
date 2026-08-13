import React from 'react';

const FluidGradientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-transparent">
      {/* Pure Pitch Black Backdrop Canvas */}
      <div className="hidden dark:block absolute inset-0 bg-black -z-10" />

      {/* Floating Translucent White Light Spheres (Monochrome Glass) */}
      <div className="absolute -top-[10%] -left-[5%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-white/8 via-white/4 to-transparent blur-[110px] opacity-50 animate-fluid-morph-1" />
      <div className="absolute -bottom-[10%] -right-[5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-white/8 via-white/4 to-transparent blur-[120px] opacity-45 animate-fluid-morph-2" />

      {/* Fine Subtle Monochrome Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />
    </div>
  );
};

export default FluidGradientBackground;
