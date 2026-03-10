import React from "react";

interface SectionHeaderProps {
	icon: React.ReactNode;
	title: React.ReactNode;
}

export function SectionHeader({ icon, title }: SectionHeaderProps) {
	return (
		<h2 className="flex items-center justify-start gap-4 text-2xl sm:text-3xl font-extrabold text-primary mb-2 tracking-wide">
			<span className="relative flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary/20 border-2 border-primary ring-4 ring-primary/30 shadow-lg">
				<span className="absolute inset-0 rounded-full bg-primary/15 blur-sm" />
				{icon}
			</span>
			<span className="flex items-center h-12">{title}</span>
		</h2>
	);
}
