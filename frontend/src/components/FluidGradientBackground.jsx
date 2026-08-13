import React from 'react';

const FluidGradientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-transparent">
      {/* Dark Mode Rich Deep Onyx Space Backdrop Overlay */}
      <div className="hidden dark:block absolute inset-0 bg-[#030712] -z-10" />

      {/* 3D Fluid Morphing Animated Mesh Orbs */}
      {/* Blob 1 - Electric Neon Cyan & Indigo Mesh */}
      <div className="absolute -top-[12%] -left-[8%] w-[60vw] h-[60vw] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-tr from-[#00E5FF]/30 via-[#6366F1]/25 to-[#9B5CFF]/15 blur-[100px] opacity-85 animate-fluid-morph-1" />

      {/* Blob 2 - Neon Violet & Magenta Mesh */}
      <div className="absolute -bottom-[12%] -right-[8%] w-[65vw] h-[65vw] rounded-[60%_40%_30%_70%/50%_30%_70%_50%] bg-gradient-to-bl from-[#9B5CFF]/30 via-[#EC4899]/25 to-[#00E5FF]/15 blur-[110px] opacity-80 animate-fluid-morph-2" />

      {/* Blob 3 - Luminous Emerald & Cyan Swirl */}
      <div className="absolute top-[25%] right-[5%] w-[50vw] h-[50vw] rounded-[50%_50%_60%_40%/30%_60%_40%_70%] bg-gradient-to-tl from-[#00FF88]/25 via-[#06B6D4]/20 to-[#3B82F6]/15 blur-[95px] opacity-75 animate-fluid-morph-3" />

      {/* Blob 4 - Sapphire & Violet Center Glow */}
      <div className="absolute bottom-[20%] left-[15%] w-[45vw] h-[45vw] rounded-[30%_70%_50%_50%/60%_40%_60%_40%] bg-gradient-to-r from-[#3B82F6]/25 via-[#8B5CF6]/20 to-[#EC4899]/15 blur-[90px] opacity-70 animate-fluid-morph-4" />

      {/* Motion Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] opacity-50 dark:opacity-30" />
    </div>
  );
};

export default FluidGradientBackground;


