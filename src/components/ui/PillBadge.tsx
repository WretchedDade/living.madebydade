import { ReactElement } from "react";

export function PillBadge({
	label,
	tone = "neutral",
}: {
	label: string;
	tone?: "neutral" | "good" | "bad";
}): ReactElement {
	const cls =
		tone === "good"
			? "border-success/40 bg-success/10 text-success"
			: tone === "bad"
				? "border-destructive/40 bg-destructive/10 text-destructive"
				: "border-border bg-muted/20 text-muted-foreground";
	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}
		>
			{label}
		</span>
	);
}
