import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { useUser, useAuth, SignInButton, SignOutButton } from '@clerk/tanstack-react-start';

interface UserAvatarCardProps {
    level?: number;
    xp?: number;
    xpMax?: number;
}

export function UserAvatarCard({
    level = 3,
    xp = 1250,
    xpMax = 2000,
}: UserAvatarCardProps) {
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open && triggerRef.current) {
            triggerRef.current.blur();
        }
    };

    const { user } = useUser();
    const { isSignedIn } = useAuth();

    const avatarUrl = user?.imageUrl;
    const userName = user?.fullName || user?.username || user?.firstName || "User";

    if (!isSignedIn) {
        return (
            <SignInButton mode="modal">
                <Button variant="primary">Sign In</Button>
            </SignInButton>
        );
    }

    return (
        <Popover.Root onOpenChange={handleOpenChange}>
            <Popover.Trigger asChild>
                <Button type="button" className="p-0 bg-transparent border-none focus:outline-none focus:ring-0" variant="ghost" ref={triggerRef}>
                    <Avatar
                        avatarUrl={avatarUrl}
                        userName={userName}
                        size="sm"
                        isSignedIn={isSignedIn}
                        className="hover:brightness-110 hover:scale-105 hover:shadow-lg transition relative cursor-pointer"
                    />
                </Button>
            </Popover.Trigger>
            <Popover.Content
                side="bottom"
                align="end"
                className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg p-4 min-w-[180px] flex flex-col items-center z-10"
                sideOffset={8}
            >
                {/* <div className="font-semibold text-cyan-400 mb-1">{userName}</div>
                <div className="text-sm text-cyan-400">Level {level}</div>
                <div className="text-xs text-zinc-400 mb-2">
                    XP: {xp?.toLocaleString()} / {xpMax?.toLocaleString()}
                </div> */}
                <div className="w-full flex flex-col items-center gap-2">
                    <SignOutButton>
                        <Button variant="primary" className="w-full">Sign Out</Button>
                    </SignOutButton>
                </div>
                <Popover.Arrow className="fill-zinc-700" />
            </Popover.Content>
        </Popover.Root>
    );
}
