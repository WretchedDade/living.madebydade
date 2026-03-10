import { ReactElement } from "react";

export function StatTile({
	label,
	value,
	tone = "default",
	extraClassName,
}: {
	label: string;
	value: ReactElement | string | number;
	tone?: "default" | "success" | "destructive" | "primary";
	extraClassName?: string;
}): ReactElement {
	const toneCls =
		tone === "success"
			? "text-success"
			: tone === "destructive"
				? "text-destructive"
				: tone === "primary"
					? "text-primary"
					: "text-foreground";
	return (
		<div className={`rounded-md border border-border bg-card p-2 ${extraClassName ?? ""}`}>
			<div className="text-muted-foreground">{label}</div>
			<div className={`${toneCls} font-mono`}>{value}</div>
		</div>
	);
}
