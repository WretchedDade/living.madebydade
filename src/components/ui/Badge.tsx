export const badgeVariants = {
	default: "bg-primary/15 text-primary border border-primary/30 shadow-sm",
	neutral: "bg-muted text-muted-foreground border border-border",
	success: "bg-success/15 text-success border border-success/30 shadow-sm",
	warning: "bg-warning/15 text-warning border border-warning/30 shadow-sm",
	error: "bg-destructive/15 text-destructive border border-destructive/30 shadow-sm",
	info: "bg-info/15 text-info border border-info/30 shadow-sm",
	primary: "bg-primary text-primary-foreground border border-primary",
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
