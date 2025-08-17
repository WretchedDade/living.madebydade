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
			? "border-emerald-600/40 bg-emerald-500/10 text-emerald-300"
			: tone === "bad"
				? "border-rose-600/40 bg-rose-500/10 text-rose-300"
				: "border-zinc-600/40 bg-zinc-700/20 text-zinc-300";
	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}
		>
			{label}
		</span>
	);
}
