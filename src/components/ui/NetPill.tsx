import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/solid";
import { ReactElement } from "react";
import { formatCurrency } from "~/utils/formatters";

export function NetPill({ net }: { net: number }): ReactElement {
	const positive = net >= 0;
	const Icon = positive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
	const tone = positive
		? "text-emerald-300 bg-emerald-500/10 border-emerald-600/40"
		: "text-rose-300 bg-rose-500/10 border-rose-600/40";
	return (
		<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${tone} font-mono`}>
			<Icon className="w-4 h-4" />
			{formatCurrency(net)}
		</span>
	);
}
