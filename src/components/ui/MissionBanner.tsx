import React from "react";

interface MissionBannerProps {
	children: React.ReactNode;
}

export function MissionBanner({ children }: MissionBannerProps) {
	return (
		<div className="mt-6 mb-8">
			<p className="font-mono text-primary text-base sm:text-lg font-bold uppercase tracking-widest px-4 py-3 rounded-xl border-2 border-primary bg-primary/10 shadow-md animate-pulse-slow">
				{children}
			</p>
		</div>
	);
}
