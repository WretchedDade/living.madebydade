// Shared style generator for Button and Link components
export interface ButtonStyleOptions {
	variant?: "primary" | "outline" | "ghost" | "subtle";
	size?: "sm" | "md" | "lg";
	icon?: boolean;
	circular?: boolean;
	className?: string;
}

export function getButtonStyles({
	variant = "primary",
	size = "md",
	icon = false,
	circular = false,
	className = "",
}: ButtonStyleOptions) {
	const base =
		"inline-flex items-center justify-center font-medium transition-colors gap-x-1 gap-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

	const variants: Record<string, string> = {
		primary:
			"bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80",
		outline:
			"bg-transparent text-foreground hover:bg-muted active:bg-muted/80",
		ghost:
			"bg-transparent text-foreground hover:bg-muted active:bg-muted/80",
		subtle:
			"bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30",
	};

	const sizes: Record<string, string> = {
		sm: icon ? "p-1 text-base" : "px-2 py-1 text-sm",
		md: icon ? "p-2 text-lg" : "px-4 py-2 text-base",
		lg: icon ? "p-3 text-xl" : "px-6 py-3 text-lg",
	};

	const iconOnly = icon && !className;
	const iconClass = iconOnly ? "flex items-center justify-center" : "";

	return [
		base,
		variants[variant],
		sizes[size],
		iconClass,
		circular ? "rounded-full" : "rounded-lg",
		className,
	]
		.filter(Boolean)
		.join(" ");
}
