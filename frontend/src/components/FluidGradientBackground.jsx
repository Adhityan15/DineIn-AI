import React from 'react';

const FluidGradientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-transparent">
      {/* Dark Mode Pure Pitch Black Canvas Overlay */}
      <div className="hidden dark:block absolute inset-0 bg-black -z-10" />

      {/* Floating Glowing Neon Orb 1 - Electric Cyan & Violet */}
      <div className="absolute -top-[10%] -left-[5%] w-[45vw] h-[45vw] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-tr from-[#00E5FF]/35 via-[#8B5CF6]/25 to-transparent blur-[85px] opacity-80 animate-fluid-morph-1" />

      {/* Floating Glowing Neon Orb 2 - Neon Magenta & Violet */}
      <div className="absolute -bottom-[10%] -right-[5%] w-[50vw] h-[50vw] rounded-[60%_40%_30%_70%/50%_30%_70%_50%] bg-gradient-to-bl from-[#EC4899]/30 via-[#9B5CFF]/25 to-transparent blur-[90px] opacity-75 animate-fluid-morph-2" />

      {/* Floating Glowing Neon Orb 3 - Emerald & Cyan */}
      <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-[50%_50%_60%_40%/30%_60%_40%_70%] bg-gradient-to-tl from-[#00FF88]/30 via-[#06B6D4]/20 to-transparent blur-[80px] opacity-70 animate-fluid-morph-3" />

      {/* Floating Glowing Neon Orb 4 - Violet Glow */}
      <div className="absolute bottom-[25%] left-[20%] w-[38vw] h-[38vw] rounded-[30%_70%_50%_50%/60%_40%_60%_40%] bg-gradient-to-r from-[#3B82F6]/25 via-[#8B5CF6]/20 to-transparent blur-[75px] opacity-65 animate-fluid-morph-4" />

      {/* Dark Motion Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:36px_36px] opacity-40 dark:opacity-20" />
    </div>
  );
};

export default FluidGradientBackground;

