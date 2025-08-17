import { ReactElement } from "react";

export type Period = "day" | "week" | "month";

export function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }): ReactElement {
	const tabs: Period[] = ["day", "week", "month"];
	return (
		<div className="inline-flex rounded-lg overflow-hidden border border-zinc-700">
			{tabs.map(p => (
				<button
					key={p}
					className={`px-3 py-1 text-sm capitalize ${
						value === p ? "bg-cyan-600 text-white" : "bg-zinc-800 text-zinc-200"
					}`}
					onClick={() => onChange(p)}
				>
					{p}
				</button>
			))}
		</div>
	);
}
