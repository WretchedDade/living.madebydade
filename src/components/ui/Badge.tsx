export const badgeVariants = {
	default: "bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 shadow-cyan-500/20",
	neutral: "bg-neutral-800 text-neutral-200 border border-neutral-700",
	success: "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 shadow-emerald-500/20",
	warning: "bg-yellow-900/60 text-yellow-300 border border-yellow-500/30 shadow-yellow-500/20",
	error: "bg-red-900/60 text-red-300 border border-red-500/30 shadow-red-500/20",
	info: "bg-blue-900/60 text-blue-300 border border-blue-500/30 shadow-blue-500/20",
	primary: "bg-cyan-400 text-zinc-900 border border-cyan-400",
} as const;

export type BadgeVariant = keyof typeof badgeVariants;

interface BadgeProps {
	children: React.ReactNode;
	variant?: BadgeVariant;
}

export function Badge({ children, variant = "default" }: BadgeProps) {
	const base = "text-xs font-semibold px-2 py-1 rounded shadow-sm";
	const variantClass = badgeVariants[variant] || badgeVariants.default;
	return <span className={`${base} ${variantClass}`.trim()}>{children}</span>;
}
