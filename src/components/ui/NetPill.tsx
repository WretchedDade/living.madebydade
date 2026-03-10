import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/solid";
import { ReactElement } from "react";
import { formatCurrency } from "~/utils/formatters";

export function NetPill({ net }: { net: number }): ReactElement {
	const positive = net >= 0;
	const Icon = positive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
	const tone = positive
		? "text-success bg-success/10 border-success/40"
		: "text-destructive bg-destructive/10 border-destructive/40";
	return (
		<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${tone} font-mono`}>
			<Icon className="w-4 h-4" />
			{formatCurrency(net)}
		</span>
	);
}
