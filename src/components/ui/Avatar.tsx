import React from "react";
import * as RadixAvatar from "@radix-ui/react-avatar";
import { UserIcon } from 'lucide-react';

interface AvatarProps {
  avatarUrl?: string;
  userName?: string;
  size?: "sm" | "lg";
  className?: string;
  isSignedIn?: boolean;
}

export function Avatar({ avatarUrl, userName = "User", size = "sm", className = "", isSignedIn = true }: AvatarProps) {
  const base =
    size === "lg"
      ? "w-12 h-12 text-xl"
      : "w-10 h-10 text-base";
  const bgColor = isSignedIn ? "bg-cyan-500" : "bg-zinc-600";
  return (
    <RadixAvatar.Root
      className={`${bgColor} rounded-full flex items-center justify-center font-bold ${base} ${className}`}
    >
      {isSignedIn && avatarUrl ? (
        <RadixAvatar.Image
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover rounded-full"
        />
      ) : null}
      <RadixAvatar.Fallback className="w-full h-full flex items-center justify-center font-bold text-white">
        {isSignedIn && !avatarUrl
          ? userName.charAt(0).toUpperCase()
          : <UserIcon className="w-6 h-6 text-zinc-300" />}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
// ...existing code from avatar.tsx will be moved here...
