import { ReactElement } from "react";

export function StatTile({
	label,
	value,
	tone = "default",
	extraClassName,
}: {
	label: string;
	value: ReactElement | string | number;
	tone?: "default" | "emerald" | "rose" | "cyan";
	extraClassName?: string;
}): ReactElement {
	const toneCls =
		tone === "emerald"
			? "text-emerald-300"
			: tone === "rose"
				? "text-rose-300"
				: tone === "cyan"
					? "text-cyan-300"
					: "text-zinc-100";
	return (
		<div className={`rounded-md border border-zinc-800 bg-zinc-900/70 p-2 ${extraClassName ?? ""}`}>
			<div className="text-zinc-400">{label}</div>
			<div className={`${toneCls} font-mono`}>{value}</div>
		</div>
	);
}
