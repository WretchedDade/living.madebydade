import React from "react";

interface SectionHeaderProps {
	icon?: React.ReactNode;
	title: React.ReactNode;
}

export function SectionHeader({ icon, title }: SectionHeaderProps) {
	return (
		<h2 className="flex items-center gap-2.5 text-lg font-bold text-foreground mb-3">
			{icon && <span className="text-primary shrink-0">{icon}</span>}
			<span>{title}</span>
		</h2>
	);
}
