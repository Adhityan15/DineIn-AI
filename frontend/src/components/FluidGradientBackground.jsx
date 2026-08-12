import React from 'react';

const FluidGradientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Liquid Mesh Blob 1 - Deep Electric Cyan & Sapphire Wave */}
      <div className="absolute -top-[15%] -left-[10%] w-[80vw] h-[80vw] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-tr from-[#00E5FF]/40 via-[#0284C7]/30 to-[#6366F1]/20 blur-[95px] opacity-85 animate-fluid-morph-1" />

      {/* Liquid Mesh Blob 2 - Deep Violet & Pink Wave */}
      <div className="absolute -bottom-[15%] -right-[10%] w-[85vw] h-[85vw] rounded-[60%_40%_30%_70%/50%_30%_70%_50%] bg-gradient-to-bl from-[#9B5CFF]/45 via-[#EC4899]/30 to-[#00F0FF]/25 blur-[100px] opacity-80 animate-fluid-morph-2" />

      {/* Liquid Mesh Blob 3 - Swirling Luminous Emerald Wave */}
      <div className="absolute top-[25%] right-[5%] w-[65vw] h-[65vw] rounded-[50%_50%_60%_40%/30%_60%_40%_70%] bg-gradient-to-tl from-[#00FF88]/35 via-[#06B6D4]/30 to-[#3B82F6]/20 blur-[90px] opacity-75 animate-fluid-morph-3" />

      {/* Liquid Mesh Blob 4 - Sapphire & Magenta Center Glow */}
      <div className="absolute bottom-[20%] left-[15%] w-[60vw] h-[60vw] rounded-[30%_70%_50%_50%/60%_40%_60%_40%] bg-gradient-to-r from-[#3B82F6]/30 via-[#8B5CF6]/25 to-[#F43F5E]/20 blur-[85px] opacity-70 animate-fluid-morph-4" />

      {/* Dark Motion Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] opacity-60" />
    </div>
  );
};

export default FluidGradientBackground;
