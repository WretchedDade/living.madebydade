import React, { useState } from "react";
import { useNavigate } from '@tanstack/react-router';
import { UserAvatarCard } from "~/components/ui/UserAvatarCard";
import { useAuth } from '@clerk/tanstack-react-start';

interface AppLayoutProps {
  level?: number;
  xp?: number;
  xpMax?: number;
  children?: React.ReactNode;
}

interface AppHeaderProps {
  level: number;
  xp: number;
  xpMax: number;
}

interface UserStatsProps {
  level: number;
  xp: number;
  xpMax: number;
}

interface AvatarProps {
  avatarUrl?: string;
  onClick?: () => void;
}

export function AppLayout({
  level = 3,
  xp = 1250,
  xpMax = 2000,
  children,
}: AppLayoutProps) {
  return (
    <div className="h-screen bg-zinc-800 text-white flex flex-col">
      <AppHeader level={level} xp={xp} xpMax={xpMax} />
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}

function AppHeader({ level, xp, xpMax }: AppHeaderProps) {
  const { isSignedIn } = useAuth();
  return (
    <header className="bg-zinc-900 text-white py-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center sm:justify-between shadow-lg border-b border-zinc-700 gap-4">
      <div className="w-full flex flex-col sm:flex-row gap-4 sm:justify-between">
        <AppTitle />
        <div className="flex flex-row items-center gap-3 w-full justify-between sm:w-auto relative">
          {/* {isSignedIn && <UserStats level={level} xp={xp} xpMax={xpMax} />} */}
          <UserAvatarCard />
        </div>
      </div>
    </header>
  );
}

function AppTitle() {
  return (
    <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-left w-full sm:w-auto m-0">
      <a
        href="/"
        className="text-cyan-400 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:text-cyan-300 transition-colors"
        aria-label="Go to Home"
        tabIndex={0}
      >
        The Living Ledger
      </a>
    </h1>
  );
}

function UserStats({ level, xp, xpMax }: UserStatsProps) {
  return (
    <div className="flex flex-col items-start sm:items-end">
      <div className="text-base sm:text-lg font-semibold text-cyan-400">Level {level}</div>
      <div className="text-xs sm:text-sm text-zinc-400">XP: {xp.toLocaleString()} / {xpMax.toLocaleString()}</div>
      <div className="w-32 sm:w-48 bg-zinc-700 rounded-full h-2 mt-1">
        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${Math.round((xp / xpMax) * 100)}%` }}></div>
      </div>
    </div>
  );
}