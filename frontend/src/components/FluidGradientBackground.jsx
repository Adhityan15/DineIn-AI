import React from 'react';

const FluidGradientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-[#040A0A]">
      {/* Deep Obsidian Canvas */}
      <div className="absolute inset-0 bg-[#040A0A] -z-10" />

      {/* CEO Template Spec: Electric Blue Running Gradient Glow (Bottom-Left) */}
      <div className="absolute -bottom-[15%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-tr from-[#0052FF]/40 via-[#49DC7A]/30 to-transparent blur-[140px] opacity-75 animate-fluid-blue" />

      {/* CEO Template Spec: Neon Lime Green Running Gradient Glow (Top-Right) */}
      <div className="absolute -top-[15%] -right-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-bl from-[#A3E635]/35 via-[#B4F73C]/20 to-transparent blur-[150px] opacity-70 animate-fluid-green" />

      {/* Subtle Ice Highlights */}
      <div className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-r from-[#22F2EF]/15 to-transparent blur-[110px] opacity-40 animate-pulse" style={{ animationDuration: '9s' }} />

      {/* Fine Subtle CEO Dark Mesh Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
    </div>
  );
};

export default FluidGradientBackground;
