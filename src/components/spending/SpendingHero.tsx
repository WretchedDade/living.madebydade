import {
	TrendingUpIcon,
	TrendingDownIcon,
	ShieldCheckIcon,
	SparklesIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";
import { formatCurrency } from "~/utils/formatters";
import type { Doc } from "convex/_generated/dataModel";
import type { CategoryClassification } from "~/lib/categories";
import { getCategoryMeta } from "~/lib/categories";

type Period = "month" | "week";

interface SpendingHeroProps {
	/** All transactions for the current period — used for totals and classification */
	transactions: Doc<"transactions">[];
	/** Previous period transactions for comparison */
	previousTransactions: Doc<"transactions">[];
	period: Period;
	onPeriodChange: (period: Period) => void;
	startDate: string;
	endDate: string;
	offset: number;
	onOffsetChange: (offset: number) => void;
	isCurrentPeriod: boolean;
}

/** Sum actual spending from transactions, excluding transfers/payments/refunds/fees */
function sumSpending(transactions: Doc<"transactions">[]): {
	total: number;
	essential: number;
	nonEssential: number;
} {
	let total = 0;
	let essential = 0;
	let nonEssential = 0;

	for (const t of transactions) {
		if (t.amount <= 0) continue;
		if (t.isInternalTransfer || t.isCreditCardPayment || t.isRefundOrReversal || t.isInterestOrFee)
			continue;

		const meta = getCategoryMeta(t.categoryPrimary);
		if (meta.classification === "excluded") continue;

		const cents = Math.abs(t.amount);
		total += cents;
		if (meta.classification === "essential") {
			essential += cents;
		} else {
			nonEssential += cents;
		}
	}

	return { total, essential, nonEssential };
}

export function SpendingHero({
	transactions,
	previousTransactions,
	period,
	onPeriodChange,
	startDate,
	endDate,
	offset,
	onOffsetChange,
	isCurrentPeriod,
}: SpendingHeroProps) {
	const current = sumSpending(transactions);
	const previous = sumSpending(previousTransactions);

	const pctChange = previous.total > 0
		? ((current.total - previous.total) / previous.total) * 100
		: 0;
	const isUp = pctChange > 0;
	const hasPrevious = previous.total > 0;

	// Build a human-readable date label
	const dateLabel = (() => {
		const start = new Date(startDate + "T12:00:00");
		if (period === "month") {
			return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
		}
		const end = new Date(endDate + "T12:00:00");
		const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
		const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
		return `${startStr} – ${endStr}`;
	})();

	const prevLabel = period === "month" ? "vs prev month" : "vs prev week";

	return (
		<div className="relative px-5 md:px-10 lg:px-12 pt-16 md:pt-24 pb-8 md:pb-10 bg-gradient-to-br from-secondary/8 via-card to-primary/6 overflow-hidden">
			{/* Decorative blurs */}
			<div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-secondary/10 blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
			<div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/8 blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

			<div className="relative z-10">
				{/* Period tabs + navigation */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex gap-1 bg-muted/50 backdrop-blur-sm rounded-lg p-1">
						<PeriodTab
							label="Monthly"
							active={period === "month"}
							onClick={() => onPeriodChange("month")}
						/>
						<PeriodTab
							label="Weekly"
							active={period === "week"}
							onClick={() => onPeriodChange("week")}
						/>
					</div>

					{/* Prev / Next navigation */}
					<div className="flex items-center gap-1">
						<button
							onClick={() => onOffsetChange(offset - 1)}
							className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
							aria-label="Previous period"
						>
							<ChevronLeftIcon className="w-4 h-4" />
						</button>
						<button
							onClick={() => onOffsetChange(offset + 1)}
							disabled={isCurrentPeriod}
							className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
							aria-label="Next period"
						>
							<ChevronRightIcon className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Date label + headline */}
				<div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
					{dateLabel}
				</div>
				<div className="flex items-baseline gap-3 mb-4">
					<span className="text-3xl sm:text-5xl font-extrabold text-foreground tabular-nums tracking-tight leading-none">
						{formatCurrency(current.total)}
					</span>
					{hasPrevious && (
						<span
							className={`flex items-center gap-1 text-xs font-semibold ${isUp ? "text-destructive" : "text-success"}`}
						>
							{isUp ? (
								<TrendingUpIcon className="w-3.5 h-3.5" />
							) : (
								<TrendingDownIcon className="w-3.5 h-3.5" />
							)}
							{Math.abs(Math.round(pctChange))}% {prevLabel}
						</span>
					)}
				</div>

				{/* Essential / Non-essential pills */}
				<div className="flex flex-wrap gap-2.5">
					<ClassificationPill
						icon={<ShieldCheckIcon className="w-3.5 h-3.5" />}
						label="Essential"
						value={formatCurrency(current.essential)}
						classification="essential"
					/>
					<ClassificationPill
						icon={<SparklesIcon className="w-3.5 h-3.5" />}
						label="Non-essential"
						value={formatCurrency(current.nonEssential)}
						classification="non-essential"
					/>
				</div>
			</div>
		</div>
	);
}

function PeriodTab({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
				active
					? "bg-background text-foreground shadow-sm"
					: "text-muted-foreground hover:text-foreground"
			}`}
		>
			{label}
		</button>
	);
}

function ClassificationPill({
	icon,
	label,
	value,
	classification,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	classification: CategoryClassification;
}) {
	const colorClass = classification === "essential" ? "text-primary" : "text-secondary";
	return (
		<div className="flex items-center gap-2 bg-background/50 backdrop-blur-md rounded-lg px-3 py-2 shadow-sm">
			<span className={`${colorClass} opacity-70`}>{icon}</span>
			<div>
				<div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">
					{label}
				</div>
				<div className={`text-sm font-bold tabular-nums ${colorClass} leading-snug`}>
					{value}
				</div>
			</div>
		</div>
	);
}
