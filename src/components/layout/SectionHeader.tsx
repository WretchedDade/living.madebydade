import React from "react";

interface SectionHeaderProps {
	icon: React.ReactNode;
	title: React.ReactNode;
}

export function SectionHeader({ icon, title }: SectionHeaderProps) {
	return (
		<h2 className="flex items-center justify-start gap-4 text-2xl sm:text-3xl font-extrabold text-cyan-400 mb-2 tracking-wide drop-shadow-lg">
			<span className="relative flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-cyan-400/40 via-blue-500/35 to-purple-600/35 border-2 border-cyan-500 ring-4 ring-cyan-400/30 shadow-[0_0_16px_4px_rgba(34,211,238,0.4)]">
				<span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-purple-600/25 blur-sm" />
				{icon}
			</span>
			<span className="flex items-center h-12">{title}</span>
		</h2>
	);
}
