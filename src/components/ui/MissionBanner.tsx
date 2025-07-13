import React from 'react';

interface MissionBannerProps {
  children: React.ReactNode;
}

export function MissionBanner({ children }: MissionBannerProps) {
  return (
    <div className="mt-6 mb-8">
      <p className="font-mono text-cyan-300 text-base sm:text-lg font-bold uppercase tracking-widest px-4 py-3 rounded-xl border-2 border-cyan-500 bg-gradient-to-r from-cyan-900 via-zinc-900 to-cyan-800 shadow-cyan-500/30 shadow-md animate-pulse-slow">
        {children}
      </p>
    </div>
  );
}
