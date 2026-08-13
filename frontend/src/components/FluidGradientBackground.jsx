import React from 'react';

const FluidGradientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-transparent">
      {/* Pure Pitch Black Backdrop Canvas in Dark Mode */}
      <div className="hidden dark:block absolute inset-0 bg-black -z-10" />

      {/* Floating Translucent White Light Spheres in Dark Mode */}
      <div className="hidden dark:block absolute -top-[10%] -left-[5%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-white/10 via-white/5 to-transparent blur-[110px] opacity-70 animate-fluid-morph-1" />
      <div className="hidden dark:block absolute -bottom-[10%] -right-[5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-white/10 via-white/5 to-transparent blur-[120px] opacity-65 animate-fluid-morph-2" />
      <div className="hidden dark:block absolute top-[30%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tl from-white/8 via-white/4 to-transparent blur-[100px] opacity-60 animate-fluid-morph-1" />

      {/* Floating Translucent Sky Blue & Ice White Fluid Orbs in Light Mode */}
      <div className="dark:hidden absolute -top-[10%] -left-[5%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-sky-400/25 via-cyan-400/15 to-indigo-500/10 blur-[110px] opacity-80 animate-fluid-morph-1" />
      <div className="dark:hidden absolute -bottom-[10%] -right-[5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-cyan-400/25 via-sky-500/15 to-blue-600/10 blur-[120px] opacity-75 animate-fluid-morph-2" />
      <div className="dark:hidden absolute top-[35%] right-[12%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tl from-white/30 via-sky-300/20 to-transparent blur-[100px] opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] opacity-40" />
    </div>
  );
};

export default FluidGradientBackground;

